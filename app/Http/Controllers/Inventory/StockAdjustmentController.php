<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Stock\StockAdjustment;
use App\Models\Stock\StockAdjustmentItem;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockAdjustmentController extends Controller
{
    private $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = $this->applyFilters(StockAdjustment::with([
            'user:id,name,avatar', 
            'approvedBy:id,name,avatar', 
            'rejectedBy:id,name,avatar', 
            'items' => function($q) {
                $q->with(['product:id,code,name', 'location:id,name']);
            }
        ]), $request);

        return response()->json($query->paginate($request->get('limit', 20)));
    }

    /**
     * Export stock adjustments to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->applyFilters(StockAdjustment::with([
            'user:id,name', 
            'items.location.branch'
        ]), $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=stock_adjustments_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Date', 'Adjustment #', 'Branch', 'Reason', 'Status', 'Items Count', 'Created By'];

        $callback = function() use($query, $columns, $request) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            $limit = $request->get('limit');
            $page = $request->get('page', 1);
            $index = $limit ? ($page - 1) * $limit + 1 : 1;

            if ($limit) {
                $adjustments = $query->orderBy('date', 'desc')
                    ->limit($limit)
                    ->offset(($page - 1) * $limit)
                    ->get();
                foreach ($adjustments as $a) {
                    $branch = $a->items->first()?->location?->branch?->name ?? 'N/A';
                    fputcsv($file, [
                        $index++,
                        $a->date ? \Carbon\Carbon::parse($a->date)->format('d-m-Y') : 'N/A',
                        $a->adjustment_no,
                        $branch,
                        $a->notes ?? '-',
                        $a->status,
                        $a->items->count(),
                        $a->user->name ?? 'N/A'
                    ]);
                }
            } else {
                $query->orderBy('date', 'desc')->chunk(200, function($adjustments) use($file, &$index) {
                    foreach ($adjustments as $a) {
                        $branch = $a->items->first()?->location?->branch?->name ?? 'N/A';
                        fputcsv($file, [
                            $index++,
                            $a->date ? \Carbon\Carbon::parse($a->date)->format('d-m-Y') : 'N/A',
                            $a->adjustment_no,
                            $branch,
                            $a->notes ?? '-',
                            $a->status,
                            $a->items->count(),
                            $a->user->name ?? 'N/A'
                        ]);
                    }
                });
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('adjustment_no', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $branchId = $request->branch_id;
            if (is_string($branchId) && str_contains($branchId, ',')) {
                $branchId = explode(',', $branchId);
            }
            $query->whereHas('items.location', function ($q) use ($branchId) {
                if (is_array($branchId)) {
                    $q->whereIn('branch_id', $branchId);
                } else {
                    $q->where('branch_id', $branchId);
                }
            });
        }

        return $query->orderBy('date', 'desc')->orderBy('created_at', 'desc');
    }

    public function store(Request $request, \App\Services\DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.location_id' => 'required|exists:inventory_locations,id',
            'items.*.current_qty' => 'required|numeric',
            'items.*.adjustment_qty' => 'required|numeric',
            'items.*.new_qty' => 'required|numeric',
            'items.*.serial_id' => 'nullable|exists:inventory_product_serials,id',
            'items.*.reason' => 'required|string',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($validated, $documentNumberService) {
            // Generate Adjustment No
            $adjustmentNo = $documentNumberService->generate('stock_adjustment');

            $adjustment = StockAdjustment::create([
                'adjustment_no' => $adjustmentNo,
                'date' => $validated['date'],
                'user_id' => Auth::id(),
                'notes' => $validated['notes'],
                'status' => $validated['status'] ?? 'DRAFT',
            ]);

            foreach ($validated['items'] as $itemData) {
                $adjustment->items()->create($itemData);
            }

            $adjustment->load(['items.product:id,code,name', 'items.location:id,name', 'user:id,name,avatar']);

            if ($adjustment->status === 'PENDING') {
                resolve(\App\Services\TelegramService::class)->broadcast('inventory.stock_adjustment', $adjustment);
            }

            return response()->json($adjustment, 201);
        });
    }

    public function update(Request $request, $id)
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if (in_array($adjustment->status, ['APPROVED', 'COMPLETED'])) {
            return response()->json(['message' => 'Cannot update an approved/completed adjustment'], 422);
        }

        $validated = $request->validate([
            'date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.location_id' => 'required|exists:inventory_locations,id',
            'items.*.current_qty' => 'required|numeric',
            'items.*.adjustment_qty' => 'required|numeric',
            'items.*.new_qty' => 'required|numeric',
            'items.*.serial_id' => 'nullable|exists:inventory_product_serials,id',
            'items.*.reason' => 'required|string',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($adjustment, $validated) {
            $adjustment->update($validated);

            if (isset($validated['items'])) {
                $adjustment->items()->delete();
                foreach ($validated['items'] as $itemData) {
                    $adjustment->items()->create($itemData);
                }
            }

            return response()->json($adjustment->load(['items.product:id,code,name', 'items.location:id,name', 'user:id,name,avatar']));
        });
    }

    public function approve($id)
    {
        $adjustment = StockAdjustment::with('items')->findOrFail($id);

        if ($adjustment->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending adjustments can be approved'], 422);
        }

        return DB::transaction(function() use ($adjustment) {
            foreach ($adjustment->items as $item) {
                // Use the reason from dropdown as movement type
                $type = $item->reason ?: ($item->adjustment_qty > 0 ? 'ADJUSTMENT_FOUND' : 'ADJUSTMENT_DAMAGE');
                
                $this->stockService->updateStock(
                    $item->product_id,
                    $item->location_id,
                    (float) $item->adjustment_qty,
                    $type,
                    $adjustment,
                    $adjustment->notes, // use overall notes as movement reason/notes
                    Auth::id(),
                    $item->serial_id
                );
            }

            $adjustment->update([
                'status' => 'APPROVED',
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
            ]);

            $adjustment->load(['items.product:id,code,name', 'items.location:id,name', 'approvedBy:id,name,avatar', 'user:id,name,avatar']);
            resolve(\App\Services\TelegramService::class)->broadcast('inventory.stock_adjustment', $adjustment);

            return response()->json($adjustment);
        });
    }

    public function reject(Request $request, $id)
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending adjustments can be rejected'], 422);
        }

        $request->validate(['reason' => 'required|string']);

        $adjustment->update([
            'status' => 'REJECTED',
            'rejected_by_id' => Auth::id(),
            'rejected_at' => now(),
            'rejected_reason' => $request->reason,
        ]);

        return response()->json($adjustment->load(['items.product:id,code,name', 'items.location:id,name', 'rejectedBy:id,name,avatar']));
    }

    public function show($id)
    {
        $adjustment = StockAdjustment::with([
            'user:id,name,avatar', 
            'approvedBy:id,name,avatar', 
            'rejectedBy:id,name,avatar', 
            'items' => function($q) {
                $q->with(['product:id,code,name', 'location:id,name', 'serial:id,serial_number,initial_quantity']);
            }
        ])->findOrFail($id);
        return response()->json($adjustment);
    }

    public function destroy($id)
    {
        $adjustment = StockAdjustment::findOrFail($id);

        if (in_array($adjustment->status, ['APPROVED', 'COMPLETED'])) {
            return response()->json(['message' => 'Cannot delete an approved/completed adjustment'], 422);
        }

        $adjustment->delete();
        return response()->json(['message' => 'Adjustment deleted successfully']);
    }
}


