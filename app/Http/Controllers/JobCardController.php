<?php

namespace App\Http\Controllers;

use App\Models\Workshop\JobCard;
use App\Models\Workshop\JobCardItem;
use App\Models\Workshop\JobCardMaterialUsage;
use App\Models\Workshop\OffCutSerial;
use App\Events\JobCardUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCard::query()
            ->withCount('replacements');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('vehicle', function($vq) use ($search) {
                      $vq->where('plate_number', 'like', "%{$search}%")
                        ->orWhere('vin_last_4', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('per_page')) {
            $jobs = $query->latest()->paginate($request->per_page);
            $this->loadJobCardListRelations($jobs->getCollection());
            return \App\Http\Resources\Workshop\JobCardResource::collection($jobs);
        }

        $jobs = $query->latest()->get();
        $this->loadJobCardListRelations($jobs);
        return \App\Http\Resources\Workshop\JobCardResource::collection($jobs);
    }

    public function show($id)
    {
        $jobCard = JobCard::findOrFail($id);
        return $this->loadJobCardRelations($jobCard);
    }

    public function update(Request $request, $id)
    {
        $jobCard = JobCard::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'notes' => 'sometimes|nullable|string',
            'technician_lead_id' => 'sometimes|nullable|exists:employees,id',
            'started_at' => 'sometimes|nullable|date',
        ]);

        if (isset($validated['technician_lead_id']) && $validated['technician_lead_id'] && !$jobCard->started_at) {
            $validated['started_at'] = now();
            if ($jobCard->status === 'Pending') {
                $validated['status'] = 'In Progress';
            }
        }

        if (isset($validated['status'])) {
            // Logic for status transitions if needed
            if ($validated['status'] === 'Delivered' && !$jobCard->completed_at) {
                $validated['completed_at'] = now();
            }
            if ($validated['status'] === 'In Progress' && !$jobCard->started_at) {
                $validated['started_at'] = now();
            }
        }

        $jobCard->update($validated);

        if ($jobCard->wasChanged('status')) {
            $this->notifyStatusChange($jobCard);
        }

        // Broadcast the update
        event(new JobCardUpdated($jobCard->id));

        return $this->loadJobCardRelations($jobCard);
    }

    public function updateItem(Request $request, $itemId)
    {
        $item = JobCardItem::findOrFail($itemId);
        
        // Normalize status strings
        if ($request->has('status')) {
            $status = $request->status;
            $normalized = match(strtolower(str_replace(['_', '-'], ' ', $status))) {
                'pending' => 'Pending',
                'assigned' => 'Assigned',
                'in progress' => 'In Progress',
                'completed' => 'Completed',
                'on hold' => 'On Hold',
                'cancelled' => 'Cancelled',
                'reworking' => 'Reworking',
                default => $status
            };
            $request->merge(['status' => $normalized]);
        }

        $validated = $request->validate([
            'technician_id' => 'sometimes|nullable|exists:employees,id', // Legacy support
            'technician_ids' => 'sometimes|array', // Multiple techs
            'technician_ids.*' => 'exists:employees,id',
            'status' => ['sometimes', \Illuminate\Validation\Rule::in(['Pending', 'Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Reworking'])],
            'notes' => 'nullable|string',
            'completion_percentage' => 'nullable|integer|min:0|max:100',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === 'In Progress' && !$item->started_at) {
                $validated['started_at'] = now();
            }
            if ($validated['status'] === 'Completed') {
                if (!$item->completed_at) {
                    $validated['completed_at'] = now();
                }
                $validated['completion_percentage'] = 100;
            }
        }

        $item->update($validated);

        // Sync multiple technicians if provided
        if (isset($validated['technician_ids'])) {
            $item->technicians()->sync($validated['technician_ids']);
        }

        // Auto update Job Card status and timestamps
        $jobCard = $item->jobCard;
        $prevStatus = $jobCard->status;

        if ($jobCard->items()->where('status', '!=', 'Completed')->count() === 0) {
            $jobCard->update([
                'status' => 'QC Review', 
                'completed_at' => $jobCard->completed_at ?: now()
            ]);
        } else {
            // Check if any item is started
            $hasStarted = $jobCard->items()->where('status', '!=', 'Pending')->exists();
            if ($hasStarted && $jobCard->status === 'Pending') {
                $jobCard->update([
                    'status' => 'In Progress'
                ]);
            }
        }

        // Broadcast to Telegram if overall status changed automatically
        if (($jobCard->wasChanged('status') || ($prevStatus === 'Pending' && $jobCard->status === 'In Progress')) && !$request->boolean('skip_notification')) {
            $this->notifyStatusChange($jobCard);
        }

        $item->load(['technicians', 'part', 'service']);

        // Broadcast the update to all connected clients
        event(new JobCardUpdated($jobCard->id));

        return $item;
    }

    public function updateItems(Request $request, $id)
    {
        $jobCard = JobCard::findOrFail($id);
        
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:job_card_items,id',
            'items.*.status' => 'sometimes|string',
            'items.*.completion_percentage' => 'sometimes|integer|min:0|max:100',
            'items.*.technician_ids' => 'sometimes|array',
            'items.*.technician_ids.*' => 'exists:employees,id',
        ]);

        DB::transaction(function() use ($validated) {
            foreach ($validated['items'] as $itemData) {
                $item = JobCardItem::findOrFail($itemData['id']);
                
                $updateData = collect($itemData)->only(['status', 'completion_percentage'])->toArray();
                
                if (isset($updateData['status'])) {
                    if ($updateData['status'] === 'In Progress' && !$item->started_at) {
                        $updateData['started_at'] = now();
                    }
                    if ($updateData['status'] === 'Completed') {
                        if (!$item->completed_at) {
                            $updateData['completed_at'] = now();
                        }
                        $updateData['completion_percentage'] = 100;
                    }
                }

                $item->update($updateData);

                if (isset($itemData['technician_ids'])) {
                    $item->technicians()->sync($itemData['technician_ids']);
                }
            }
        });

        // Refresh model to get latest items status
        $jobCard->refresh();

        // Auto update Job Card status based on items
        if ($jobCard->items()->where('status', '!=', 'Completed')->count() === 0) {
            if ($jobCard->status !== 'Delivered' && $jobCard->status !== 'Ready') {
                $jobCard->update([
                    'status' => 'QC Review', 
                    'completed_at' => $jobCard->completed_at ?: now()
                ]);
            }
        } else {
            $hasStarted = $jobCard->items()->where('status', '!=', 'Pending')->exists();
            if ($hasStarted && $jobCard->status === 'Pending') {
                $jobCard->update([
                    'status' => 'In Progress'
                ]);
            }
        }

        // Trigger the unified progress notification (Customer + Team)
        // This method also sends the JobCardUpdated event if needed, but we'll call it explicitly for clarity if not
        $this->notifyProgressSync($request, $id);

        return $this->loadJobCardRelations($jobCard);
    }

    public function storeMaterialUsage(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'product_id' => 'required|exists:inventory_products,id',
            'job_card_item_id' => 'nullable|exists:job_card_items,id',
            'spent_qty' => 'required|numeric|min:0',
            'actual_qty' => 'sometimes|numeric',
            'serial_id' => 'sometimes|nullable|exists:inventory_product_serials,id',
            'width_on_car' => 'sometimes|nullable|numeric',
            'height_on_car' => 'sometimes|nullable|numeric',
            'width_cut' => 'sometimes|nullable|numeric',
            'height_cut' => 'sometimes|nullable|numeric',
            'is_damage' => 'boolean',
            'is_off_cut' => 'boolean'
        ]);

        $product = \App\Models\Inventory\Product::find($validated['product_id']);
        
        $usage = JobCardMaterialUsage::create([
            'job_card_id' => $validated['job_card_id'],
            'job_card_item_id' => $validated['job_card_item_id'],
            'product_id' => $validated['product_id'],
            'serial_id' => $validated['serial_id'] ?? null,
            'spent_qty' => $validated['spent_qty'],
            'actual_qty' => $validated['actual_qty'] ?? $validated['spent_qty'],
            'unit' => $product->unit ?? 'm',
            'width_on_car' => $validated['width_on_car'] ?? null,
            'height_on_car' => $validated['height_on_car'] ?? null,
            'width_cut' => $validated['width_cut'] ?? null,
            'height_cut' => $validated['height_cut'] ?? null,
            'is_damage' => $validated['is_damage'] ?? false,
            'is_off_cut' => $validated['is_off_cut'] ?? false,
        ]);

        return $usage->load('product');
    }

    public function updateMaterialUsage(Request $request, $usageId, \App\Services\Inventory\StockService $stockService)
    {
        $usage = JobCardMaterialUsage::with(['jobCard', 'serial'])->findOrFail($usageId);
        $jobCard = $usage->jobCard;
        
        $validated = $request->validate([
            'spent_qty' => 'sometimes|numeric',
            'actual_qty' => 'sometimes|numeric',
            'serial_id' => 'sometimes|nullable|exists:inventory_product_serials,id',
            'width_on_car' => 'sometimes|nullable|numeric',
            'height_on_car' => 'sometimes|nullable|numeric',
            'width_cut' => 'sometimes|nullable|numeric',
            'height_cut' => 'sometimes|nullable|numeric',
            'is_off_cut' => 'sometimes|boolean',
            'notes' => 'nullable|string',
        ]);

        $oldQty = (float)($usage->actual_qty ?: $usage->spent_qty);

        return DB::transaction(function() use ($usage, $validated, $jobCard, $oldQty, $stockService) {
            $usage->update($validated);
            
            // No automatic deduction on save. 
            // Deduction is handled only when Finalize is clicked.
            
            return $usage->load('serial');
        });
    }

    public function getAvailableSerials(Request $request, $productId)
    {
        $query = \App\Models\Inventory\ProductSerial::where('product_id', $productId)
            ->where('status', 'Available');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        return $query->get();
    }

    public function complete(Request $request, $id, \App\Services\Inventory\StockService $stockService)
    {
        $jobCard = JobCard::with(['materialUsage.serial', 'order'])->findOrFail($id);
        $isSilent = $request->boolean('silent');
        
        DB::transaction(function() use ($jobCard, $stockService, $isSilent) {
            // Deduct Materials from Stock (Smart Finalize - Deduct only the difference)
            foreach ($jobCard->materialUsage as $usage) {
                $targetQty = (float)($usage->actual_qty ?: $usage->spent_qty);
                
                // Calculate how much was already deducted for this specific usage record
                $previouslyDeducted = \App\Models\Stock\StockMovement::where('reference_type', \App\Models\Workshop\JobCardMaterialUsage::class)
                    ->where('reference_id', $usage->id)
                    ->where('movement_type', 'JOB_CARD_CONSUMPTION')
                    ->sum('quantity');
                
                // StockMovement quantities for deduction are negative, so we take the absolute sum
                $alreadyDeductedQty = abs((float)$previouslyDeducted);
                $diff = $targetQty - $alreadyDeductedQty;

                // Only proceed if there is a meaningful difference to deduct (or add back)
                if (abs($diff) < 0.0001) continue;

                // 1. Handle Serialized Items
                if ($usage->serial) {
                    $serial = $usage->serial;
                    $prevSerialQty = (float)$serial->current_quantity;
                    
                    // Adjust serial quantity
                    $serial->decrement('current_quantity', $diff);
                    
                    // Update Serial Status
                    if ($serial->current_quantity <= 0) {
                        $serial->update(['status' => 'Empty']);
                    } else if ($serial->current_quantity > 0 && $serial->status === 'Empty') {
                        $serial->update(['status' => 'Available']);
                    }

                    // Record Serial Movement
                    \App\Models\Inventory\SerialMovement::create([
                        'serial_id' => $serial->id,
                        'product_id' => $usage->product_id,
                        'location_id' => $serial->location_id,
                        'user_id' => auth()->id(),
                        'movement_type' => 'JOB_CARD_CONSUMPTION',
                        'quantity' => -$diff,
                        'width' => $usage->width_cut,
                        'height' => $usage->height_cut,
                        'previous_quantity' => $prevSerialQty,
                        'current_quantity' => (float)$serial->current_quantity,
                        'reference_type' => \App\Models\Workshop\JobCardMaterialUsage::class,
                        'reference_id' => $usage->id,
                        'reason' => 'Stock adjustment for Job Card #' . $jobCard->job_no . ' (ID: ' . $usage->id . ')'
                    ]);

                    // Record General Stock Movement
                    \App\Models\Stock\StockMovement::create([
                        'product_id' => $usage->product_id,
                        'location_id' => $serial->location_id,
                        'serial_id' => $usage->serial_id,
                        'user_id' => auth()->id(),
                        'movement_type' => 'JOB_CARD_CONSUMPTION',
                        'quantity' => -$diff,
                        'previous_quantity' => $prevSerialQty,
                        'current_quantity' => (float)$serial->current_quantity,
                        'reference_type' => JobCardMaterialUsage::class,
                        'reference_id' => $usage->id,
                        'reason' => 'Consumed in Job Card #' . $jobCard->job_no . ' (Serial: ' . $serial->serial_number . ')'
                    ]);
                } else {
                    // 2. Handle Bulk Items
                    $branchId = $jobCard->branch_id ?? ($jobCard->order ? $jobCard->order->branch_id : null);
                    
                    if ($branchId) {
                        $stockService->deductFromBranch(
                            $usage->product_id,
                            $branchId,
                            $diff,
                            'JOB_CARD_CONSUMPTION',
                            $usage, // Reference the usage model
                            'Consumed in Job Card #' . $jobCard->job_no
                        );
                        
                        // Note: StockService->deductFromBranch records StockMovement with reference_type = class($usage)
                    }
                }
            }

            if (!$isSilent) {
                // Update associated Sales Order if needed
                if ($jobCard->order) {
                    $jobCard->order->update(['status' => 'COMPLETED']);
                }

                // Finalize status at the end of successful deduction
                $jobCard->update([
                    'status' => 'Delivered',
                    'completed_at' => $jobCard->completed_at ?: now()
                ]);
            }
        });

        if (!$isSilent) {
            // Notify customer about job completion and rating
            try {
                $telegram = resolve(\App\Services\TelegramService::class);
                $telegram->notifyCustomer('services.job_completed', $jobCard->fresh());
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to notify customer on completion: " . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Job Card inventory processed successfully']);
    }

    public function createReplacement(Request $request, $id)
    {
        $original = JobCard::findOrFail($id);

        $validated = $request->validate([
            'damage_type_id' => 'required|exists:job_card_damage_types,id',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.part_id' => 'required|exists:job_parts_master,id',
        ]);

        return DB::transaction(function() use ($original, $validated) {
            // Generate next job number
            $lastJob = JobCard::latest('id')->first();
            $nextId = ($lastJob ? $lastJob->id : 0) + 1;
            $jobNo = 'JOB-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $replacement = JobCard::create([
                'job_no' => $jobNo,
                'sales_order_id' => $original->sales_order_id,
                'branch_id' => $original->branch_id,
                'customer_id' => $original->customer_id,
                'vehicle_id' => $original->vehicle_id,
                'mileage_in' => $original->mileage_in,
                'status' => 'Pending',
                'type' => 'replacement',
                'parent_id' => $original->id,
                'damage_type_id' => $validated['damage_type_id'],
                'notes' => $validated['notes']
            ]);

            foreach ($validated['items'] as $item) {
                JobCardItem::create([
                    'job_card_id' => $replacement->id,
                    'service_id' => $item['service_id'],
                    'part_id' => $item['part_id'],
                    'status' => 'Pending',
                    'completion_percentage' => 0
                ]);
            }

            $replacement->load(['items.part', 'items.service', 'damageType']);
            event(new JobCardUpdated($replacement->id));
            return $replacement;
        });
    }

    public function notifyProgressSync(Request $request, $id)
    {
        $jobCard = JobCard::with(['customer', 'vehicle.model', 'vehicle.brand', 'leadTechnician', 'items.part', 'items.service'])->findOrFail($id);
        
        $telegram = resolve(\App\Services\TelegramService::class);
        
        // 1. Notify Internal Team
        $telegram->broadcast('services.job_status_updated', $jobCard);
        
        // 2. Notify Customer
        $telegram->notifyCustomer('services.job_status_updated', $jobCard);

        // 3. Broadcast real-time update to all connected clients
        event(new \App\Events\JobCardUpdated($jobCard->id));
        
        return response()->json(['message' => 'Progress notifications sent successfully']);
    }

    public function storeRating(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'service_rating' => 'required|integer|min:1|max:5',
            'technical_rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $jobCard = JobCard::findOrFail($validated['job_card_id']);

        // In TMA, customer_id should be inferred from auth or passed if it's a specific endpoint
        // Assuming the current user (Sanctum/TMA Auth) is the customer
        $customerId = $request->user()->id; 

        // Check if already rated
        if ($jobCard->rating) {
            return response()->json(['error' => 'Job card already rated'], 422);
        }

        $rating = \App\Models\Workshop\JobCardRating::create([
            'job_card_id' => $jobCard->id,
            'customer_id' => $customerId,
            'service_rating' => $validated['service_rating'],
            'technical_rating' => $validated['technical_rating'],
            'comment' => $validated['comment']
        ]);

        // Notify Telegram
        try {
            $rating->load(['jobCard.branch', 'customer']);
            (new \App\Services\TelegramService($jobCard->branch_id))->broadcast('crm.job_card_rating_received', $rating);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Rating Telegram Notification Failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Thank you for your feedback!',
            'rating' => $rating
        ]);
    }
    public function updateRating(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|exists:job_cards,id',
            'comment' => 'required|string|max:500',
        ]);

        $jobCard = JobCard::with('rating')->findOrFail($validated['job_card_id']);
        
        if (!$jobCard->rating) {
            return response()->json(['error' => 'Rating not found. Please rate first.'], 404);
        }

        // Verify customer owns this job
        $user = $request->user();
        if ($jobCard->customer_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $jobCard->rating->update([
            'comment' => $validated['comment']
        ]);

        return response()->json([
            'message' => 'Comment updated successfully!',
            'rating' => $jobCard->rating
        ]);
    }

    protected function notifyStatusChange(JobCard $jobCard)
    {
        $telegram = resolve(\App\Services\TelegramService::class);
        $jobCard->load(['customer', 'vehicle', 'leadTechnician']);
        $telegram->broadcast('services.job_status_updated', $jobCard);
        $telegram->notifyCustomer('services.job_status_updated', $jobCard);
    }

    public function warrantyData($id)
    {
        $jobCard = JobCard::with([
            'customer:id,name,phone,customer_no,address',
            'vehicle:id,customer_id,brand_id,model_id,plate_number,color,year',
            'vehicle.brand:id,name,image',
            'vehicle.model:id,name',
            'branch:id,name,code,phone,address',
            'materialUsage' => function($q) {
                $q->select('id', 'job_card_id', 'product_id', 'job_card_item_id', 'spent_qty', 'actual_qty', 'unit', 'created_at');
            },
            'materialUsage.product:id,name,code,sku,warranty_duration,warranty_unit,lifespan_duration,lifespan_unit',
            'materialUsage.jobCardItem.part:id,name,code,type',
            'items' => function($q) {
                $q->select('id', 'job_card_id', 'service_id', 'part_id');
            },
            'items.service:id,name',
        ])->findOrFail($id);

        if (!$jobCard->warranty_no) {
            $docService = resolve(\App\Services\DocumentNumberService::class);
            $jobCard->update([
                'warranty_no' => $docService->generate('job_warranty_card', $jobCard->branch_id)
            ]);
        }

        return response()->json($jobCard);
    }

    private function loadJobCardListRelations($jobs)
    {
        return $jobs->load([
            'customer:id,name,phone,customer_no',
            'vehicle:id,customer_id,brand_id,model_id,plate_number,vin_last_4,color,year',
            'vehicle.brand:id,name,image',
            'vehicle.model:id,name',
            'branch:id,name,code',
            'leadTechnician:id,full_name,employee_id,profile_image',
            'qcReport.qcPerson:id,full_name,employee_id,profile_image'
        ]);
    }

    private function loadJobCardRelations(JobCard $jobCard)
    {
        return $jobCard->load([
            'order:id,order_no,customer_id,grand_total,status,payment_status,created_at',
            'order.items:id,sales_order_id,item_name,quantity,unit_price',
            'branch:id,name,code',
            'customer:id,name,phone,customer_no,telegram_user_id,tma_notifications_enabled',
            'vehicle:id,customer_id,brand_id,model_id,plate_number,color,year',
            'vehicle.brand:id,name,image',
            'vehicle.model:id,name',
            'items' => function($q) {
                $q->select('id', 'job_card_id', 'service_id', 'part_id', 'status', 'completion_percentage', 'started_at', 'completed_at', 'notes');
            },
            'items.service:id,name,code',
            'items.part:id,name,code,side',
            'items.technicians:id,full_name,employee_id,profile_image',
            'materialUsage' => function($q) {
                $q->select('id', 'job_card_id', 'product_id', 'job_card_item_id', 'spent_qty', 'is_damage', 'created_at');
            },
            'materialUsage.product:id,name,code,sku',
            'materialUsage.jobCardItem.part:id,name,code',
            'materialUsage.serial:id,serial_number,product_id',
            'parent:id,job_no,status',
            'replacements:id,job_no,status,parent_id',
            'damageType:id,name',
            'leadTechnician:id,full_name,employee_id,profile_image'
        ]);
    }
}



