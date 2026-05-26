<?php

namespace App\Http\Controllers;

use App\Models\Workshop\JobCard;
use App\Models\Workshop\JobCardItem;
use App\Models\Workshop\JobCardDamage;
use App\Models\HR\Employee;
use App\Models\Inventory\ProductSerial;
use App\Models\Inventory\SerialMovement;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

use App\Http\Resources\Services\DamageReportResource;

class DamageReportController extends Controller
{
    /**
     * List all damage reports with filters and pagination.
     */
    public function index(Request $request)
    {
        $query = JobCardDamage::with([
            'jobCard.customer',
            'jobCard.branch',
            'jobCardItem.part',
            'damageType',
            'serial.product',
            'serial.branch',
            'qcReport.qcPerson'
        ]);

        $this->applyDamageFilters($query, $request);

        $paginator = $query->latest()->paginate($request->per_page ?? 15);

        $paginator->getCollection()->transform(function ($damage) {
            $staffIds = array_unique(array_merge($damage->mistake_staff_ids ?? [], $damage->rework_staff_ids ?? []));
            $staffNames = Employee::whereIn('id', $staffIds)->pluck('full_name', 'id');
            
            $damage->mistake_staff_names = collect($damage->mistake_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->toArray();
            $damage->rework_staff_names = collect($damage->rework_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->toArray();
            
            return $damage;
        });

        return DamageReportResource::collection($paginator);
    }

    /**
     * Manually store a new damage report.
     * No side effects on other records as per user request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'nullable|exists:job_cards,id',
            'job_card_item_id' => 'nullable|exists:job_card_items,id',
            'mistake_staff_ids' => 'nullable|array',
            'mistake_staff_ids.*' => 'exists:employees,id',
            'rework_staff_ids' => 'nullable|array',
            'rework_staff_ids.*' => 'exists:employees,id',
            'damage_type_id' => 'required|exists:job_card_damage_types,id',
            'serial_id' => 'nullable|exists:inventory_product_serials,id',
            'width' => 'nullable|numeric',
            'height' => 'nullable|numeric',
            'quantity' => 'nullable|numeric',
            'rating' => 'nullable|integer|min:1|max:5',
            'notes' => 'nullable|string',
            'incident_phase' => 'nullable|string',
        ]);

        return DB::transaction(function() use ($validated) {
            $damage = JobCardDamage::create(array_merge($validated, [
                'status' => 'unfixed'
            ]));

            // Stock Deduction Logic
            if (!empty($validated['serial_id']) && !empty($validated['quantity'])) {
                $serial = ProductSerial::find($validated['serial_id']);
                $productId = $serial->product_id;
                $locationId = $serial->location_id;

                // Ensure quantity is negative for deduction
                $deductQty = -abs((float) $validated['quantity']);

                resolve(StockService::class)->updateStock(
                    $productId,
                    $locationId,
                    $deductQty,
                    'DAMAGE_REPORT',
                    $damage,
                    'Damage Report: ' . ($validated['notes'] ?? 'No notes'),
                    Auth::id(),
                    (int) $validated['serial_id']
                );
            }

            $damage->load(['jobCard.customer', 'jobCard.branch', 'jobCardItem.part', 'damageType', 'serial.product', 'serial.branch', 'qcReport.qcPerson']);

            // Populate staff names for the resource
            $staffIds = array_unique(array_merge($damage->mistake_staff_ids ?? [], $damage->rework_staff_ids ?? []));
            $staffNames = Employee::whereIn('id', $staffIds)->pluck('full_name', 'id');
            $damage->mistake_staff_names = collect($damage->mistake_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->toArray();
            $damage->rework_staff_names = collect($damage->rework_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->toArray();

            // Broadcast Damage Report to Telegram
            try {
                resolve(\App\Services\TelegramService::class)->broadcast('services.damage_reported', $damage);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to broadcast damage report: " . $e->getMessage());
            }

            return new DamageReportResource($damage);
        });
    }

    /**
     * Export damage reports to CSV.
     */
    public function export(Request $request)
    {
        $query = JobCardDamage::with([
            'jobCard.customer',
            'jobCardItem.part',
            'damageType'
        ]);

        $this->applyDamageFilters($query, $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=damage_reports_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Incident Date', 'Job Card #', 'Customer', 'Component', 'Failure Reason', 'Mistake Liability', 'Rework Team', 'Notes'];

        $callback = function() use($query, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            $index = 1;
            $query->latest()->chunk(200, function($damages) use($file, &$index) {
                // Collect all staff IDs for bulk lookup
                $allStaffIds = $damages->flatMap(function($d) {
                    return array_merge($d->mistake_staff_ids ?? [], $d->rework_staff_ids ?? []);
                })->unique()->filter()->toArray();

                $staffNames = Employee::whereIn('id', $allStaffIds)->pluck('full_name', 'id');

                foreach ($damages as $damage) {
                    $mistakeNames = collect($damage->mistake_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->implode(', ');
                    $reworkNames = collect($damage->rework_staff_ids)->map(fn($id) => $staffNames[$id] ?? 'Unknown')->implode(', ');

                    fputcsv($file, [
                        $index++,
                        $damage->created_at?->format('Y-m-d H:i') ?? 'N/A',
                        $damage->jobCard->job_no ?? 'N/A',
                        $damage->jobCard->customer->name ?? 'N/A',
                        $damage->jobCardItem->part->name ?? 'N/A',
                        $damage->damageType->name ?? 'N/A',
                        $mistakeNames ?: 'N/A',
                        $reworkNames ?: 'N/A',
                        $damage->notes
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Fetch available serials for the damage report form.
     * Supports searching across all products or filtering by product/branch.
     */
    public function availableSerials(Request $request)
    {
        $query = ProductSerial::with(['product', 'branch', 'location'])
            ->where('status', 'Available')
            ->where('current_quantity', '>', 0);

        // Security Guard: Non-super-admins can only see serials from their branches
        $user = Auth::user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');

        if (!$isSuperAdmin) {
            $authorizedBranchIds = [];
            if (method_exists($user, 'branches')) {
                $authorizedBranchIds = $user->branches()->pluck('branches.id')->toArray();
            }
            if (empty($authorizedBranchIds) && isset($user->branch_id)) {
                $authorizedBranchIds = [$user->branch_id];
            }
            
            $query->whereIn('branch_id', $authorizedBranchIds);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        return $query->orderBy('serial_number')->limit(50)->get();
    }

    /**
     * Apply common filters for damage reports.
     */
    private function applyDamageFilters($query, Request $request)
    {
        // 1. Mandatory Branch Isolation for non-super-admins
        $user = Auth::user();
        $isSuperAdmin = method_exists($user, 'hasRole') && $user->hasRole('super-admin');

        if (!$isSuperAdmin) {
            $authorizedBranchIds = [];
            if (method_exists($user, 'branches')) {
                $authorizedBranchIds = $user->branches()->pluck('branches.id')->toArray();
            }
            if (empty($authorizedBranchIds) && isset($user->branch_id)) {
                $authorizedBranchIds = [$user->branch_id];
            }

            if (empty($authorizedBranchIds)) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where(function($q) use ($authorizedBranchIds) {
                    $q->whereHas('jobCard', function($sq) use ($authorizedBranchIds) {
                        $sq->whereIn('branch_id', $authorizedBranchIds);
                    })->orWhereIn('branch_id', $authorizedBranchIds); // For serial-based damages
                });
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('jobCard', function($q2) use ($search) {
                    $q2->where('job_no', 'like', "%{$search}%")
                       ->orWhereHas('customer', function($q3) use ($search) {
                           $q3->where('name', 'like', "%{$search}%");
                       });
                })->orWhereHas('jobCardItem.part', function($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->has('branch_id')) {
            $requestedBranchId = $request->branch_id;
            $query->where(function($q) use ($requestedBranchId) {
                $q->whereHas('jobCard', function($sq) use ($requestedBranchId) {
                    if (is_array($requestedBranchId)) {
                        $sq->whereIn('branch_id', $requestedBranchId);
                    } else {
                        $sq->where('branch_id', $requestedBranchId);
                    }
                })->orWhere(function($sq) use ($requestedBranchId) {
                    if (is_array($requestedBranchId)) {
                        $sq->whereIn('branch_id', $requestedBranchId);
                    } else {
                        $sq->where('branch_id', $requestedBranchId);
                    }
                });
            });
        }

        if ($request->has('mistake_staff_id')) {
            $staffId = (int)$request->mistake_staff_id;
            $query->whereJsonContains('mistake_staff_ids', $staffId);
        }

        if ($request->has('damage_type_id')) {
            $query->where('damage_type_id', $request->damage_type_id);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
    }
}
