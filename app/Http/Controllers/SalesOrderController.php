<?php

namespace App\Http\Controllers;

use App\Models\Sales\SalesOrder;
use App\Models\Sales\SalesOrderItem;
use App\Models\Workshop\JobCard;
use App\Models\Workshop\JobCardItem;
use App\Models\Workshop\JobCardMaterialUsage;
use App\Models\Stock\Stock;
use App\Models\Stock\StockMovement;
use App\Models\Stock\Location;
use App\Models\Workshop\Service;
use App\Services\DocumentNumberService;
use App\Events\SalesOrderUpdated;
use App\Events\JobCardUpdated;
use App\Models\System\SystemSetting;
use App\Models\Sales\SalesInvoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Jobs\ProcessSystemActivityLog;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageService;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrder::with(['customer', 'vehicle.brand', 'vehicle.model', 'items.itemable', 'deposits', 'creator']);
        
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('order_date', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        if ($request->payment_status && $request->payment_status !== 'ALL') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->tax_status && $request->tax_status !== 'ALL') {
            if ($request->tax_status === 'VAT') {
                $query->where('tax_total', '>', 0);
            } else {
                $query->where(function($q) {
                    $q->where('tax_total', '<=', 0)->orWhereNull('tax_total');
                });
            }
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('branch_id')) {
            $branchIds = is_array($request->branch_id) 
                ? $request->branch_id 
                : explode(',', $request->branch_id);
            $query->whereIn('branch_id', $branchIds);
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function store(Request $request, DocumentNumberService $documentNumberService, \App\Services\Inventory\StockService $stockService)
    {
        // Check for active shift
        $activeShift = \App\Models\Sales\SaleShift::where('branch_id', $request->branch_id)
            ->active()
            ->exists();

        if (!$activeShift) {
            return response()->json([
                'message' => 'You must open a shift for this branch before creating a Sales Order.',
                'requires_shift' => true
            ], 403);
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'invoice_image' => 'nullable',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.job_part_id' => 'nullable|exists:job_parts_master,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.original_item_id' => 'nullable|exists:job_card_items,id',
            'items.*.damage_type_id' => 'nullable|exists:job_card_damage_types,id',
            'subtotal' => 'required|numeric',
            'taxable_amount' => 'nullable|numeric',
            'tax_percent' => 'nullable|numeric',
            'tax_total' => 'nullable|numeric',
            'discount_type' => 'nullable|string|in:FIXED,PERCENT',
            'discount_value' => 'nullable|numeric',
            'discount_total' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'deposits' => 'nullable|array',
            'deposits.*.amount' => 'required|numeric|min:0',
            'deposits.*.payment_account_id' => 'required|exists:payment_accounts,id',
            'deposits.*.date' => 'required|date',
            'deposits.*.notes' => 'nullable|string',
            'deposits.*.receipt' => 'nullable',
            'notes' => 'nullable|string',
            'parent_job_id' => 'nullable|exists:job_cards,id',
            'damage_type_id' => 'nullable|exists:job_card_damage_types,id',
            'sale_remark_id' => 'nullable|exists:sale_remarks,id',
            'exchange_rate' => 'nullable|numeric',
            'subtotal_khr' => 'nullable|numeric',
            'grand_total_khr' => 'nullable|numeric',
        ]);

        $order = null;

        DB::transaction(function () use ($request, $validated, $documentNumberService, $stockService, &$order) {
            $type = !empty($validated['parent_job_id']) ? 'replacement' : 'sales_order';
            $orderNo = $documentNumberService->generate($type, $validated['branch_id']);

            $totalPaid = collect($validated['deposits'] ?? [])->sum('amount');

            $imageService = new ImageService();
            $invoiceImagePath = null;
            if ($request->hasFile('invoice_image')) {
                $invoiceImagePath = $imageService->compressToWebp($request->file('invoice_image'), 'invoices');
            } elseif ($request->invoice_image) {
                $invoiceImagePath = str_replace(Storage::disk('public')->url(''), '', $request->invoice_image);
                $invoiceImagePath = ltrim($invoiceImagePath, '/');
            }

            $order = SalesOrder::create([
                'order_no' => $orderNo,
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'sale_remark_id' => $validated['sale_remark_id'] ?? 1, // Default 1 (Normal Sale)
                'invoice_image_path' => $invoiceImagePath,
                'order_date' => $validated['order_date'],
                'subtotal' => $validated['subtotal'],
                'taxable_amount' => $validated['taxable_amount'] ?? 0,
                'tax_percent' => $validated['tax_percent'] ?? 0,
                'tax_total' => $validated['tax_total'] ?? 0,
                'discount_type' => $validated['discount_type'] ?? 'FIXED',
                'discount_value' => $validated['discount_value'] ?? 0,
                'discount_total' => $validated['discount_total'] ?? 0,
                'grand_total' => $validated['grand_total'],
                'paid_amount' => $totalPaid,
                'balance_amount' => $validated['grand_total'] - $totalPaid,
                'status' => 'CONFIRMED',
                'payment_status' => $totalPaid >= $validated['grand_total'] ? 'PAID' : ($totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id() ?? 1,
                'exchange_rate' => $validated['exchange_rate'] ?? SystemSetting::get('exchange_rate_current_value', 4100),
                'subtotal_khr' => $validated['subtotal_khr'] ?? ($validated['subtotal'] * ($validated['exchange_rate'] ?? SystemSetting::get('exchange_rate_current_value', 4100))),
                'grand_total_khr' => $validated['grand_total_khr'] ?? ($validated['grand_total'] * ($validated['exchange_rate'] ?? SystemSetting::get('exchange_rate_current_value', 4100))),
            ]);

            // --- 1. CREATE ITEMS AND DEDUCT STOCK ---
            $hasService = false;
            $itemsWithJobParts = [];

            foreach ($validated['items'] as $itemData) {
                $itemable_type = null;
                $itemable_id = null;
                $item_name = 'Unknown Item';

                if (!empty($itemData['service_id'])) {
                    $service = Service::find($itemData['service_id']);
                    $itemable_type = Service::class;
                    $itemable_id = $service->id;
                    $item_name = $service->name;
                    $hasService = true;
                } elseif (!empty($itemData['product_id'])) {
                    $product = \App\Models\Inventory\Product::find($itemData['product_id']);
                    $itemable_type = \App\Models\Inventory\Product::class;
                    $itemable_id = $product->id;
                    $item_name = $product->name;
                }

                $orderItem = SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'itemable_type' => $itemable_type,
                    'itemable_id' => $itemable_id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'job_part_id' => $itemData['job_part_id'] ?? null,
                    'original_item_id' => $itemData['original_item_id'] ?? null,
                    'damage_type_id' => $itemData['damage_type_id'] ?? null,
                    'item_name' => $item_name,
                    'quantity' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount'] ?? 0,
                    'subtotal' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);

                if (!empty($itemData['job_part_id']) && !empty($itemData['product_id'])) {
                    $itemsWithJobParts[] = [
                        'product_id' => $itemData['product_id'],
                        'job_part_id' => $itemData['job_part_id'],
                        'qty' => $itemData['qty'],
                        'service_id' => $itemData['service_id'] ?? null
                    ];
                }

                // Deduct Stock for DIRECT product sales ONLY
                if (!empty($itemData['product_id']) && empty($itemData['job_part_id'])) {
                    $stockService->deductFromBranch(
                        $itemData['product_id'],
                        $validated['branch_id'],
                        $itemData['qty'],
                        'OUT',
                        $order,
                        "Sales Order #{$order->order_no} direct sale"
                    );
                }
            }

            // --- 2. BROADCAST ORDER CREATED FIRST ---
            resolve(\App\Services\TelegramService::class)->broadcast('sales.order_created', $order->load(['customer', 'vehicle.brand', 'vehicle.model', 'items.product', 'items.jobPart', 'creator']));

            // --- 3. CREATE DEPOSITS AND BROADCAST PAYMENTS ---
            foreach ($validated['deposits'] ?? [] as $index => $dep) {
                $depositReceiptPath = null;
                if ($request->hasFile("deposits.{$index}.receipt")) {
                    $depositReceiptPath = $imageService->compressToWebp($request->file("deposits.{$index}.receipt"), 'receipts/deposits');
                } elseif ($request->input("deposits.{$index}.receipt")) {
                    $depositReceiptPath = str_replace(Storage::disk('public')->url(''), '', $request->input("deposits.{$index}.receipt"));
                    $depositReceiptPath = ltrim($depositReceiptPath, '/');
                }
                $deposit = $order->deposits()->create([
                    'amount' => $dep['amount'],
                    'payment_account_id' => $dep['payment_account_id'],
                    'deposit_date' => $dep['date'] ?? now(),
                    'notes' => $dep['notes'] ?? null,
                    'receipt_path' => $depositReceiptPath,
                    'created_by' => Auth::id() ?? 1,
                ]);

                // --- FINANCE: Record Income ---
                $salesCategory = \App\Models\Finance\IncomeCategory::where('name', 'Sales Revenue')->first();
                $income = resolve(\App\Services\Finance\FinanceService::class)->recordIncome([
                    'income_category_id' => $salesCategory ? $salesCategory->id : 1,
                    'payment_account_id' => $deposit->payment_account_id,
                    'amount' => $deposit->amount,
                    'date' => $deposit->deposit_date ?? now(),
                    'description' => "Payment for Sales Order #{$order->order_no}",
                    'reference_no' => $order->order_no,
                ]);
                
                $deposit->update(['payment_transaction_id' => $income->payment_transaction_id]);

                // Broadcast each payment to Telegram
                resolve(\App\Services\TelegramService::class)->broadcast('sales.payment_received', $deposit->load(['order', 'paymentAccount', 'creator']));
            }

            // --- 4. ENGINE LOGIC (Job Card, etc) ---
            if ($hasService || !empty($itemsWithJobParts)) {
                $jobCard = $this->generateJobCard($order, $validated, $itemsWithJobParts, $documentNumberService);
                if ($jobCard) {
                    $order->setRelation('jobCard', $jobCard);
                }
            }

            // --- SYSTEM ACTIVITY LOG ---
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'sales',
                'description'  => "created sales_order",
                'subject_type' => get_class($order),
                'subject_id'   => $order->id,
                'event'        => 'created',
                'causer_type'  => Auth::user() ? get_class(Auth::user()) : null,
                'causer_id'    => Auth::id(),
                'properties'   => [
                    'module'      => 'sales',
                    'order_no'    => $order->order_no,
                    'customer'    => $order->customer?->name ?? 'Walk-in',
                    'grand_total' => $order->grand_total,
                    'input'       => $validated
                ],
            ]);

            // --- 5. CREATE FORMAL INVOICE ---
            SalesInvoice::create([
                'invoice_no' => $documentNumberService->generate('invoice', $order->branch_id),
                'sales_order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'branch_id' => $order->branch_id,
                'invoice_date' => $order->order_date,
                'due_date' => $order->order_date, // Default to same day for POS
                'subtotal' => $order->subtotal,
                'tax_total' => $order->tax_total,
                'discount_total' => $order->discount_total,
                'grand_total' => $order->grand_total,
                'paid_amount' => $order->paid_amount,
                'balance_amount' => $order->balance_amount,
                'status' => 'FINALIZED',
                'payment_status' => $order->payment_status,
                'created_by' => Auth::id() ?? 1,
            ]);
        });

        // Broadcast updates
        event(new SalesOrderUpdated($order));
        if ($order->jobCard) {
            event(new JobCardUpdated($order->jobCard->id));
        } else {
            // Fallback: search for it if not loaded
            $jobCard = \App\Models\Workshop\JobCard::where('sales_order_id', $order->id)->first();
            if ($jobCard) {
                event(new JobCardUpdated($jobCard->id));
            }
        }

        return response()->json($order->load(['customer', 'items', 'jobCard.items']), 201);
    }

    private function generateJobCard(SalesOrder $order, array $validated, array $itemsWithJobParts, DocumentNumberService $documentNumberService): ?JobCard
    {
        $jobNo = $documentNumberService->generate('job_card', $order->branch_id);
        $jobCard = JobCard::create([
            'job_no' => $jobNo,
            'sales_order_id' => $order->id,
            'branch_id' => $order->branch_id,
            'customer_id' => $order->customer_id,
            'vehicle_id' => $order->vehicle_id,
            'mileage_in' => $order->vehicle?->current_mileage ?? 0,
            'status' => 'Pending',
            'type' => !empty($validated['parent_job_id']) ? 'replacement' : 'installation',
            'parent_id' => $validated['parent_job_id'] ?? null,
            'damage_type_id' => $validated['damage_type_id'] ?? null,
        ]);

        // If this is a replacement, log it as a damage/incident after delivery
        if (!empty($validated['parent_job_id'])) {
            // Check if items have specific reasons, otherwise use the global one
            foreach ($order->items as $orderItem) {
                // We map order items back to original job card items if provided
                if ($orderItem->itemable_type === Service::class) continue; // Skip main service lines, look at parts
                
                \App\Models\Workshop\JobCardDamage::create([
                    'job_card_id' => $validated['parent_job_id'],
                    'sales_order_id' => $order->id,
                    'job_card_item_id' => $orderItem->original_item_id ?? null,
                    'damage_type_id' => $orderItem->damage_type_id ?? $validated['damage_type_id'] ?? null,
                    'incident_phase' => 'after_delivered',
                    'notes' => $validated['notes'] ?? 'Post-delivery replacement claim',
                    'status' => 'REPLACED'
                ]);
            }
            
            // If no item-specific damage was created (unlikely but safe), create a general one
            if ($order->items->whereNotNull('damage_type_id')->count() === 0 && !isset($validated['damage_type_id'])) {
                // Logic to ensure at least one record exists if parent_job_id is set
            }
        }

        $itemsData = $validated['items'];
        foreach ($itemsData as $itemData) {
            if (!empty($itemData['service_id']) && empty($itemData['job_part_id'])) {
                $service = Service::with(['parts', 'materials'])->find($itemData['service_id']);
                
                // Check if this service has explicit parts being handled in this order
                $hasExplicitParts = collect($itemsData)
                    ->where('service_id', $itemData['service_id'])
                    ->whereNotNull('job_part_id')
                    ->isNotEmpty();

                $parentJobItem = null;
                
                // Only create the base service item if no explicit parts were selected
                if (!$hasExplicitParts) {
                    $parentJobItem = JobCardItem::create([
                        'job_card_id' => $jobCard->id,
                        'service_id' => $service->id,
                        'part_id' => null,
                        'status' => 'Pending',
                    ]);

                    // Add parts that DON'T have a specific product selected in this sale (Implicit parts)
                    foreach ($service->parts as $part) {
                        $isExplicitlyHandled = collect($itemsWithJobParts)->where('job_part_id', $part->id)->where('service_id', $service->id)->first();
                        if (!$isExplicitlyHandled) {
                            JobCardItem::create([
                                'job_card_id' => $jobCard->id,
                                'service_id' => $service->id,
                                'part_id' => $part->id,
                                'status' => 'Pending',
                            ]);
                        }
                    }
                }

                // Map standard materials (only if parent job item exists to attach them to)
                if ($parentJobItem) {
                    foreach ($service->materials as $mat) {
                        JobCardMaterialUsage::create([
                            'job_card_id' => $jobCard->id,
                            'job_card_item_id' => $parentJobItem->id,
                            'product_id' => $mat->product_id,
                            'spent_qty' => $mat->suggested_qty * $itemData['qty'],
                            'actual_qty' => 0,
                            'unit' => 'pcs',
                        ]);
                    }
                }
            }
        }

        // 2. Process products explicitly linked to parts
        foreach ($itemsWithJobParts as $pLink) {
            $jobItem = JobCardItem::create([
                'job_card_id' => $jobCard->id,
                'service_id' => $pLink['service_id'],
                'part_id' => $pLink['job_part_id'],
                'status' => 'Pending',
            ]);

            JobCardMaterialUsage::create([
                'job_card_id' => $jobCard->id,
                'job_card_item_id' => $jobItem->id,
                'product_id' => $pLink['product_id'],
                'spent_qty' => $pLink['qty'],
                'actual_qty' => 0,
                'unit' => 'pcs',
            ]);
        }
        return $jobCard;
    }

    public function addDeposit(Request $request, $id)
    {
        $order = SalesOrder::findOrFail($id);

        // Check for active shift
        $activeShift = \App\Models\Sales\SaleShift::where('branch_id', $order->branch_id)
            ->active()
            ->exists();

        if (!$activeShift) {
            return response()->json([
                'message' => 'You must open a shift for this branch before adding a payment.',
                'requires_shift' => true
            ], 403);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_account_id' => 'required|exists:payment_accounts,id',
            'deposit_date' => 'required|date',
            'receipt' => 'nullable',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function() use ($request, $validated, $order) {
            $imageService = new ImageService();
            $depositReceiptPath = null;
            if ($request->hasFile('receipt')) {
                $depositReceiptPath = $imageService->compressToWebp($request->file('receipt'), 'receipts/deposits');
            } elseif ($request->receipt) {
                $depositReceiptPath = str_replace(Storage::disk('public')->url(''), '', $request->receipt);
                $depositReceiptPath = ltrim($depositReceiptPath, '/');
            }

                $deposit = $order->deposits()->create([
                    'amount' => $validated['amount'],
                    'payment_account_id' => $validated['payment_account_id'],
                    'deposit_date' => $validated['deposit_date'] ?? now(),
                    'receipt_path' => $depositReceiptPath,
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => Auth::id() ?? 1,
                ]);

                // --- FINANCE: Record Income ---
                $salesCategory = \App\Models\Finance\IncomeCategory::where('name', 'Sales Revenue')->first();
                $income = resolve(\App\Services\Finance\FinanceService::class)->recordIncome([
                    'income_category_id' => $salesCategory ? $salesCategory->id : 1,
                    'payment_account_id' => $deposit->payment_account_id,
                    'amount' => $deposit->amount,
                    'date' => $deposit->deposit_date ?? now(),
                    'description' => "Payment for Sales Order #{$order->order_no}",
                    'reference_no' => $order->order_no,
                ]);

                $deposit->update(['payment_transaction_id' => $income->payment_transaction_id]);

                // Update order totals
                $order->paid_amount += $validated['amount'];
                $order->balance_amount = round($order->grand_total - $order->paid_amount, 2);

            // Update payment status
            if ($order->balance_amount <= 0.01) { // Small threshold for floating point
                $order->payment_status = 'PAID';
                $order->balance_amount = 0;
            } elseif ($order->paid_amount > 0) {
                $order->payment_status = 'PARTIAL';
            } else {
                $order->payment_status = 'UNPAID';
            }

            $order->save();

            // Sync with Invoice
            if ($order->invoice) {
                $order->invoice->update([
                    'paid_amount' => $order->paid_amount,
                    'balance_amount' => $order->balance_amount,
                    'payment_status' => $order->payment_status,
                ]);
            }

            // Broadcast to Telegram
            resolve(\App\Services\TelegramService::class)->broadcast('sales.payment_received', $deposit->load(['order', 'paymentAccount', 'creator']));

            // --- SYSTEM ACTIVITY LOG ---
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'sales',
                'description'  => "added payment to sales_order",
                'subject_type' => get_class($order),
                'subject_id'   => $order->id,
                'event'        => 'updated',
                'causer_type'  => Auth::user() ? get_class(Auth::user()) : null,
                'causer_id'    => Auth::id(),
                'properties'   => [
                    'module'         => 'sales',
                    'order_no'       => $order->order_no,
                    'deposit_amount' => $validated['amount'],
                    'total_paid'     => $order->paid_amount,
                ],
            ]);
        });

        event(new SalesOrderUpdated($order));

        return response()->json($order->load('deposits.paymentAccount'), 201);
    }

    public function updateDeposit(Request $request, $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_account_id' => 'required|exists:payment_accounts,id',
            'deposit_date' => 'required|date',
            'receipt' => 'nullable',
            'notes' => 'nullable|string',
        ]);

        $deposit = \App\Models\Sales\SalesOrderDeposit::findOrFail($id);
        $order = $deposit->order;

        DB::transaction(function() use ($request, $validated, $deposit, $order) {
            $imageService = new ImageService();
            $depositReceiptPath = $deposit->receipt_path;
            if ($request->hasFile('receipt')) {
                $depositReceiptPath = $imageService->compressToWebp($request->file('receipt'), 'receipts/deposits');
            } elseif ($request->receipt) {
                $depositReceiptPath = str_replace(Storage::disk('public')->url(''), '', $request->receipt);
                $depositReceiptPath = ltrim($depositReceiptPath, '/');
            }

            // --- FINANCE: Revert Old Transaction and Income if exists ---
            if ($deposit->payment_transaction_id) {
                // Find and delete the associated Income record first
                \App\Models\Finance\Income::where('payment_transaction_id', $deposit->payment_transaction_id)->delete();
                resolve(\App\Services\Finance\FinanceService::class)->revertTransaction($deposit->payment_transaction_id);
            }

            $deposit->update([
                'amount' => $validated['amount'],
                'payment_account_id' => $validated['payment_account_id'],
                'deposit_date' => $validated['deposit_date'],
                'receipt_path' => $depositReceiptPath,
                'notes' => $validated['notes'] ?? null,
            ]);

            // --- FINANCE: Record New Income ---
            $salesCategory = \App\Models\Finance\IncomeCategory::where('name', 'Sales Revenue')->first();
            $income = resolve(\App\Services\Finance\FinanceService::class)->recordIncome([
                'income_category_id' => $salesCategory ? $salesCategory->id : 1,
                'payment_account_id' => $deposit->payment_account_id,
                'amount' => $deposit->amount,
                'date' => $deposit->deposit_date,
                'description' => "Updated payment for Sales Order #{$order->order_no}",
                'reference_no' => $order->order_no,
            ]);

            $deposit->update(['payment_transaction_id' => $income->payment_transaction_id]);

            // Recalculate order totals
            $totalPaid = $order->deposits()->sum('amount');
            $order->paid_amount = $totalPaid;
            $order->balance_amount = round($order->grand_total - $totalPaid, 2);

            // Update payment status
            if ($order->balance_amount <= 0.01) {
                $order->payment_status = 'PAID';
                $order->balance_amount = 0;
            } elseif ($order->paid_amount > 0) {
                $order->payment_status = 'PARTIAL';
            } else {
                $order->payment_status = 'UNPAID';
            }

            $order->save();

            // Sync with Invoice
            if ($order->invoice) {
                $order->invoice->update([
                    'paid_amount' => $order->paid_amount,
                    'balance_amount' => $order->balance_amount,
                    'payment_status' => $order->payment_status,
                ]);
            }

            // --- SYSTEM ACTIVITY LOG ---
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'sales',
                'description'  => "updated payment on sales_order",
                'subject_type' => get_class($order),
                'subject_id'   => $order->id,
                'event'        => 'updated',
                'causer_type'  => Auth::user() ? get_class(Auth::user()) : null,
                'causer_id'    => Auth::id(),
                'properties'   => [
                    'module'         => 'sales',
                    'order_no'       => $order->order_no,
                    'deposit_id'     => $deposit->id,
                    'new_amount'     => $validated['amount'],
                    'total_paid'     => $order->paid_amount,
                ],
            ]);
        });

        event(new SalesOrderUpdated($order));

        return response()->json($order->load(['deposits.paymentAccount', 'deposits.creator']), 200);
    }

    public function deleteDeposit($id)
    {
        $deposit = \App\Models\Sales\SalesOrderDeposit::findOrFail($id);
        $order = $deposit->order;

        DB::transaction(function() use ($deposit, $order) {
            // --- FINANCE: Revert Transaction and Income if exists ---
            if ($deposit->payment_transaction_id) {
                // Find and delete the associated Income record first
                \App\Models\Finance\Income::where('payment_transaction_id', $deposit->payment_transaction_id)->delete();
                resolve(\App\Services\Finance\FinanceService::class)->revertTransaction($deposit->payment_transaction_id);
            }
            
            $deposit->delete();

            // Recalculate order totals
            $totalPaid = $order->deposits()->sum('amount');
            $order->paid_amount = $totalPaid;
            $order->balance_amount = round($order->grand_total - $totalPaid, 2);

            // Update payment status
            if ($order->balance_amount <= 0.01) {
                if ($order->paid_amount > 0) {
                    $order->payment_status = 'PAID';
                } else {
                    $order->payment_status = 'UNPAID';
                }
                $order->balance_amount = 0;
            } elseif ($order->paid_amount > 0) {
                $order->payment_status = 'PARTIAL';
            } else {
                $order->payment_status = 'UNPAID';
            }

            $order->save();

            // Sync with Invoice
            if ($order->invoice) {
                $order->invoice->update([
                    'paid_amount' => $order->paid_amount,
                    'balance_amount' => $order->balance_amount,
                    'payment_status' => $order->payment_status,
                ]);
            }

            // --- SYSTEM ACTIVITY LOG ---
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'sales',
                'description'  => "deleted payment from sales_order",
                'subject_type' => get_class($order),
                'subject_id'   => $order->id,
                'event'        => 'deleted',
                'causer_type'  => Auth::user() ? get_class(Auth::user()) : null,
                'causer_id'    => Auth::id(),
                'properties'   => [
                    'module'         => 'sales',
                    'order_no'       => $order->order_no,
                    'deleted_amount' => $deposit->amount,
                    'total_paid'     => $order->paid_amount,
                ],
            ]);
        });

        event(new SalesOrderUpdated($order));

        return response()->json($order->load(['deposits.paymentAccount', 'deposits.creator']), 200);
    }

    public function show($id)
    {
        return SalesOrder::with(['customer', 'vehicle.brand', 'vehicle.model', 'items.itemable', 'items.product', 'items.jobPart', 'jobCard.items.part', 'jobCard.materialUsage.product', 'deposits.paymentAccount', 'deposits.creator', 'creator'])->findOrFail($id);
    }

    public function cancel($id, \App\Services\Inventory\StockService $stockService)
    {
        $order = SalesOrder::findOrFail($id);
        if ($order->status === 'Completed') {
            return response()->json(['message' => 'Cannot cancel a completed order'], 422);
        }
        
        DB::transaction(function() use ($order, $stockService) {
            if ($order->status === 'Cancelled') return;

            $order->update([
                'status' => 'CANCELLED',
                'balance_amount' => 0,
            ]);

            // Sync with Invoice
            if ($order->invoice) {
                $order->invoice->update([
                    'status' => 'CANCELLED',
                    'balance_amount' => 0,
                ]);
            }

            // Broadcast to Telegram
            resolve(\App\Services\TelegramService::class)->broadcast('sales.order_cancelled', $order->load(['customer', 'vehicle.brand', 'vehicle.model', 'items.product', 'items.jobPart', 'creator']));
    
            if ($order->jobCard) {
                $order->jobCard->update(['status' => 'Cancelled']);
            }

            // --- STOCK RESTOCK LOGIC ---
            // We restock everything back to the PRIMARY location for simplicity
            $location = Location::where('branch_id', $order->branch_id)
                ->where('is_active', true)
                ->where('is_primary', true)
                ->first() ?: Location::where('branch_id', $order->branch_id)->first();

            if ($location) {
                foreach ($order->items as $item) {
                     // Only restock direct product sales (mimics the logic in store())
                    if ($item->itemable_type === \App\Models\Inventory\Product::class && empty($item->job_part_id)) {
                        $stockService->updateStock(
                            $item->itemable_id,
                            $location->id,
                            $item->quantity,
                            'IN',
                            $order,
                            "Sales Order #{$order->order_no} cancellation restock"
                        );
                    }
                }
            }

            // --- SYSTEM ACTIVITY LOG ---
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'sales',
                'description'  => "cancelled sales_order",
                'subject_type' => get_class($order),
                'subject_id'   => $order->id,
                'event'        => 'deleted',
                'causer_type'  => Auth::user() ? get_class(Auth::user()) : null,
                'causer_id'    => Auth::id(),
                'properties'   => [
                    'module'   => 'sales',
                    'order_no' => $order->order_no,
                    'reason'   => 'Manual cancellation'
                ],
            ]);
        });

        event(new SalesOrderUpdated($order));
        if ($order->jobCard) {
            event(new JobCardUpdated($order->jobCard->id));
        }

        return response()->json(['message' => 'Order cancelled successfully']);
    }
    public function update(Request $request, $id, DocumentNumberService $documentNumberService, \App\Services\Inventory\StockService $stockService)
    {
        // Check for active shift
        $activeShift = \App\Models\Sales\SaleShift::where('user_id', auth()->id())
            ->where('branch_id', $request->branch_id)
            ->active()
            ->exists();

        if (!$activeShift) {
            return response()->json([
                'message' => 'You must open a shift for this branch before updating a Sales Order.',
                'requires_shift' => true
            ], 403);
        }
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'invoice_image' => 'nullable',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.job_part_id' => 'nullable|exists:job_parts_master,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric',
            'taxable_amount' => 'nullable|numeric',
            'tax_percent' => 'nullable|numeric',
            'tax_total' => 'nullable|numeric',
            'discount_type' => 'nullable|string|in:FIXED,PERCENT',
            'discount_value' => 'nullable|numeric',
            'discount_total' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'notes' => 'nullable|string',
            'exchange_rate' => 'nullable|numeric',
            'subtotal_khr' => 'nullable|numeric',
            'grand_total_khr' => 'nullable|numeric',
        ]);

        $order = SalesOrder::with('items')->findOrFail($id);

        DB::transaction(function () use ($request, $validated, $documentNumberService, $order, $stockService) {
            // 1. RESTOCK OLD ITEMS (Back to Primary)
            $location = Location::where('branch_id', $order->branch_id)
                ->where('is_active', true)
                ->where('is_primary', true)
                ->first() ?: Location::where('branch_id', $order->branch_id)->first();

            if ($location) {
                foreach ($order->items as $item) {
                    if ($item->itemable_type === \App\Models\Inventory\Product::class && empty($item->job_part_id)) {
                        $stockService->updateStock(
                            $item->itemable_id,
                            $location->id,
                            $item->quantity,
                            'IN',
                            $order,
                            "Sales Order #{$order->order_no} update reversal"
                        );
                    }
                }
            }

            // 2. UPDATE ORDER DATA
            $invoiceImagePath = $order->invoice_image_path;
            $imageService = new ImageService();
            if ($request->hasFile('invoice_image')) {
                $invoiceImagePath = $imageService->compressToWebp($request->file('invoice_image'), 'invoices');
            } elseif ($request->invoice_image) {
                $invoiceImagePath = str_replace(Storage::disk('public')->url(''), '', $request->invoice_image);
                $invoiceImagePath = ltrim($invoiceImagePath, '/');
            }

            $order->update([
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'invoice_image_path' => $invoiceImagePath,
                'order_date' => $validated['order_date'],
                'subtotal' => $validated['subtotal'],
                'taxable_amount' => $validated['taxable_amount'] ?? 0,
                'tax_percent' => $validated['tax_percent'] ?? 0,
                'tax_total' => $validated['tax_total'] ?? 0,
                'discount_type' => $validated['discount_type'] ?? 'FIXED',
                'discount_value' => $validated['discount_value'] ?? 0,
                'discount_total' => $validated['discount_total'] ?? 0,
                'grand_total' => $validated['grand_total'],
                'balance_amount' => $validated['grand_total'] - $order->paid_amount,
                'payment_status' => $order->paid_amount >= $validated['grand_total'] ? 'PAID' : ($order->paid_amount > 0 ? 'PARTIAL' : 'UNPAID'),
                'notes' => $validated['notes'] ?? null,
                'exchange_rate' => $validated['exchange_rate'] ?? SystemSetting::get('exchange_rate_current_value', 4100),
                'subtotal_khr' => $validated['subtotal_khr'] ?? ($validated['subtotal'] * ($validated['exchange_rate'] ?? SystemSetting::get('exchange_rate_current_value', 4100))),
                'grand_total_khr' => $validated['grand_total_khr'] ?? ($validated['grand_total'] * ($validated['exchange_rate'] ?? SystemSetting::get('exchange_rate_current_value', 4100))),
            ]);

            // 3. DELETE OLD ITEMS & CREATE NEW ONES + DEDUCT STOCK
            $order->items()->delete();

            $hasService = false;
            $itemsWithJobParts = [];

            // Get branch ID for new item deduction
            $branchId = $validated['branch_id'];

            foreach ($validated['items'] as $itemData) {
                $itemable_type = null;
                $itemable_id = null;
                $item_name = 'Unknown Item';

                if (!empty($itemData['service_id'])) {
                    $service = Service::find($itemData['service_id']);
                    $itemable_type = Service::class;
                    $itemable_id = $service->id;
                    $item_name = $service->name;
                    $hasService = true;
                } elseif (!empty($itemData['product_id'])) {
                    $product = \App\Models\Inventory\Product::find($itemData['product_id']);
                    $itemable_type = \App\Models\Inventory\Product::class;
                    $itemable_id = $product->id;
                    $item_name = $product->name;
                }

                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'itemable_type' => $itemable_type,
                    'itemable_id' => $itemable_id,
                    'product_id' => $itemData['product_id'] ?? null,
                    'job_part_id' => $itemData['job_part_id'] ?? null,
                    'original_item_id' => $itemData['original_item_id'] ?? null,
                    'damage_type_id' => $itemData['damage_type_id'] ?? null,
                    'item_name' => $item_name,
                    'quantity' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount'] ?? 0,
                    'subtotal' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);

                if (!empty($itemData['job_part_id']) && !empty($itemData['product_id'])) {
                    $itemsWithJobParts[] = [
                        'product_id' => $itemData['product_id'],
                        'job_part_id' => $itemData['job_part_id'],
                        'qty' => $itemData['qty'],
                        'service_id' => $itemData['service_id'] ?? null
                    ];
                }

                if (!empty($itemData['product_id']) && empty($itemData['job_part_id'])) {
                    $stockService->deductFromBranch(
                        $itemData['product_id'],
                        $validated['branch_id'],
                        $itemData['qty'],
                        'OUT',
                        $order,
                        "Sales Order #{$order->order_no} update deduction"
                    );
                }
            }

            // 4. SYNC JOB CARD
            if ($order->jobCard) {
                $order->jobCard->update([
                    'branch_id' => $order->branch_id,
                    'customer_id' => $order->customer_id,
                    'vehicle_id' => $order->vehicle_id,
                ]);
                $order->jobCard->items()->delete();
                \App\Models\Workshop\JobCardMaterialUsage::where('job_card_id', $order->jobCard->id)->delete();

                if ($hasService || !empty($itemsWithJobParts)) {
                    $jobCard = $this->repopulateJobCard($order->jobCard, $validated['items'], $itemsWithJobParts);
                    event(new JobCardUpdated($jobCard->id));
                } else {
                    $order->jobCard->update(['status' => 'CANCELLED']);
                    event(new JobCardUpdated($order->jobCard->id));
                }
            } elseif ($hasService || !empty($itemsWithJobParts)) {
                $jobCard = $this->generateJobCard($order, $validated['items'], $itemsWithJobParts, $documentNumberService);
                if ($jobCard) {
                    event(new JobCardUpdated($jobCard->id));
                }
            }

            // --- SYSTEM ACTIVITY LOG ---
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'sales',
                'description'  => "updated sales_order",
                'subject_type' => get_class($order),
                'subject_id'   => $order->id,
                'event'        => 'updated',
                'causer_type'  => Auth::user() ? get_class(Auth::user()) : null,
                'causer_id'    => Auth::id(),
                'properties'   => [
                    'module'      => 'sales',
                    'order_no'    => $order->order_no,
                    'customer'    => $order->customer?->name ?? 'Walk-in',
                    'grand_total' => $order->grand_total,
                    'attributes'  => $order->getChanges(),
                    'old'         => array_intersect_key($order->getOriginal(), $order->getChanges()),
                ],
            ]);

            // 5. UPDATE FORMAL INVOICE
            if ($order->invoice) {
                $order->invoice->update([
                    'customer_id' => $order->customer_id,
                    'branch_id' => $order->branch_id,
                    'invoice_date' => $order->order_date,
                    'subtotal' => $order->subtotal,
                    'tax_total' => $order->tax_total,
                    'discount_total' => $order->discount_total,
                    'grand_total' => $order->grand_total,
                    'paid_amount' => $order->paid_amount,
                    'balance_amount' => $order->balance_amount,
                    'payment_status' => $order->payment_status,
                ]);
            }
        });

        event(new SalesOrderUpdated($order));
        if ($order->jobCard) {
            event(new JobCardUpdated($order->jobCard->id));
        }

        return response()->json($order->refresh()->load(['customer', 'items', 'jobCard.items']));
    }

    private function repopulateJobCard(JobCard $jobCard, array $itemsData, array $itemsWithJobParts): JobCard
    {
        foreach ($itemsData as $itemData) {
            if (!empty($itemData['service_id']) && empty($itemData['job_part_id'])) {
                $service = Service::with(['parts', 'materials'])->find($itemData['service_id']);
                
                // Check if this service has explicit parts being handled in this order
                $hasExplicitParts = collect($itemsData)
                    ->where('service_id', $itemData['service_id'])
                    ->whereNotNull('job_part_id')
                    ->isNotEmpty();

                $parentJobItem = null;

                if (!$hasExplicitParts) {
                    $parentJobItem = JobCardItem::create([
                        'job_card_id' => $jobCard->id,
                        'service_id' => $service->id,
                        'part_id' => null,
                        'status' => 'Pending',
                    ]);

                    foreach ($service->parts as $part) {
                        $isExplicitlyHandled = collect($itemsWithJobParts)->where('job_part_id', $part->id)->where('service_id', $service->id)->first();
                        if (!$isExplicitlyHandled) {
                            JobCardItem::create([
                                'job_card_id' => $jobCard->id,
                                'service_id' => $service->id,
                                'part_id' => $part->id,
                                'status' => 'Pending',
                            ]);
                        }
                    }
                }

                if ($parentJobItem) {
                    foreach ($service->materials as $mat) {
                        \App\Models\Workshop\JobCardMaterialUsage::create([
                            'job_card_id' => $jobCard->id,
                            'job_card_item_id' => $parentJobItem->id,
                            'product_id' => $mat->product_id,
                            'spent_qty' => $mat->suggested_qty * $itemData['qty'],
                            'actual_qty' => 0,
                            'unit' => 'pcs',
                        ]);
                    }
                }
            }
        }

        foreach ($itemsWithJobParts as $pLink) {
            $jobItem = JobCardItem::create([
                'job_card_id' => $jobCard->id,
                'service_id' => $pLink['service_id'],
                'part_id' => $pLink['job_part_id'],
                'status' => 'Pending',
            ]);

            \App\Models\Workshop\JobCardMaterialUsage::create([
                'job_card_id' => $jobCard->id,
                'job_card_item_id' => $jobItem->id,
                'product_id' => $pLink['product_id'],
                'spent_qty' => $pLink['qty'],
                'actual_qty' => 0,
                'unit' => 'pcs',
            ]);
        }
        return $jobCard;
    }
}



