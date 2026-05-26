<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Stock\StockTransfer;
use App\Models\Stock\StockTransferItem;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockTransferController extends Controller
{
    private $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = $this->applyFilters(StockTransfer::with([
            'user:id,name,avatar', 
            'approvedBy:id,name,avatar', 
            'rejectedBy:id,name,avatar', 
            'fromLocation:id,name', 
            'toLocation:id,name', 
            'items' => function($q) {
                $q->with('product:id,code,name');
            }
        ]), $request);

        return response()->json($query->paginate($request->get('limit', 20)));
    }

    /**
     * Export stock transfers to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->applyFilters(StockTransfer::with([
            'user:id,name', 
            'fromLocation.branch',
            'toLocation.branch',
            'items'
        ]), $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=stock_transfers_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Date', 'Transfer #', 'From Branch', 'To Branch', 'Status', 'Items Count', 'Created By'];

        $callback = function() use($query, $columns, $request) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            $limit = $request->get('limit');
            $page = $request->get('page', 1);
            $index = $limit ? ($page - 1) * $limit + 1 : 1;

            if ($limit) {
                $transfers = $query->orderBy('date', 'desc')
                    ->limit($limit)
                    ->offset(($page - 1) * $limit)
                    ->get();
                foreach ($transfers as $t) {
                    fputcsv($file, [
                        $index++,
                        $t->date ? \Carbon\Carbon::parse($t->date)->format('d-m-Y') : 'N/A',
                        $t->transfer_no,
                        $t->fromLocation->branch->name ?? 'N/A',
                        $t->toLocation->branch->name ?? 'N/A',
                        $t->status,
                        $t->items->count(),
                        $t->user->name ?? 'N/A'
                    ]);
                }
            } else {
                $query->orderBy('date', 'desc')->chunk(200, function($transfers) use($file, &$index) {
                    foreach ($transfers as $t) {
                        fputcsv($file, [
                            $index++,
                            $t->date ? \Carbon\Carbon::parse($t->date)->format('d-m-Y') : 'N/A',
                            $t->transfer_no,
                            $t->fromLocation->branch->name ?? 'N/A',
                            $t->toLocation->branch->name ?? 'N/A',
                            $t->status,
                            $t->items->count(),
                            $t->user->name ?? 'N/A'
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
                $q->where('transfer_no', 'like', "%{$search}%")
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
            $query->where(function($q) use ($branchId) {
                $q->whereHas('fromLocation', function ($sq) use ($branchId) {
                    if (is_array($branchId)) {
                        $sq->whereIn('branch_id', $branchId);
                    } else {
                        $sq->where('branch_id', $branchId);
                    }
                })->orWhereHas('toLocation', function ($sq) use ($branchId) {
                    if (is_array($branchId)) {
                        $sq->whereIn('branch_id', $branchId);
                    } else {
                        $sq->where('branch_id', $branchId);
                    }
                });
            });
        }

        return $query->orderBy('date', 'desc')->orderBy('created_at', 'desc');
    }

    public function store(Request $request, \App\Services\DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'from_location_id' => 'required|exists:inventory_locations,id',
            'to_location_id' => 'required|exists:inventory_locations,id|different:from_location_id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($validated, $documentNumberService) {
            // Generate Transfer No
            $transferNo = $documentNumberService->generate('stock_transfer');

            $transfer = StockTransfer::create([
                'transfer_no' => $transferNo,
                'from_location_id' => $validated['from_location_id'],
                'to_location_id' => $validated['to_location_id'],
                'date' => $validated['date'],
                'user_id' => Auth::id(),
                'notes' => $validated['notes'],
                'status' => $validated['status'] ?? 'DRAFT',
            ]);

            foreach ($validated['items'] as $itemData) {
                $transfer->items()->create($itemData);
            }

            $transfer->load(['items.product:id,code,name', 'fromLocation:id,name', 'toLocation:id,name', 'user:id,name,avatar']);

            if ($transfer->status === 'PENDING') {
                resolve(\App\Services\TelegramService::class)->broadcast('inventory.stock_transfer', $transfer);
            }

            return response()->json($transfer, 201);
        });
    }

    public function show($id)
    {
        $transfer = StockTransfer::with([
            'user:id,name,avatar', 
            'approvedBy:id,name,avatar', 
            'rejectedBy:id,name,avatar', 
            'fromLocation:id,name', 
            'toLocation:id,name', 
            'items.product:id,code,name'
        ])->findOrFail($id);
        return response()->json($transfer);
    }

    public function update(Request $request, $id)
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'DRAFT') {
            return response()->json(['message' => 'Cannot update a non-draft transfer'], 422);
        }

        $validated = $request->validate([
            'from_location_id' => 'sometimes|required|exists:inventory_locations,id',
            'to_location_id' => 'sometimes|required|exists:inventory_locations,id|different:from_location_id',
            'date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($transfer, $validated) {
            $transfer->update($validated);

            if (isset($validated['items'])) {
                $transfer->items()->delete();
                foreach ($validated['items'] as $itemData) {
                    $transfer->items()->create($itemData);
                }
            }

            return response()->json($transfer->load(['items.product:id,code,name', 'fromLocation:id,name', 'toLocation:id,name', 'user:id,name,avatar']));
        });
    }

    public function approve($id)
    {
        $transfer = StockTransfer::with('items')->findOrFail($id);

        if ($transfer->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending transfers can be approved'], 422);
        }

        return DB::transaction(function() use ($transfer) {
            foreach ($transfer->items as $item) {
                $this->stockService->transferStock(
                    $item->product_id,
                    $transfer->from_location_id,
                    $transfer->to_location_id,
                    (float) $item->quantity,
                    $transfer,
                    $transfer->notes
                );
            }

            $transfer->update([
                'status' => 'APPROVED',
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
            ]);

            $transfer->load(['items.product:id,code,name', 'fromLocation:id,name', 'toLocation:id,name', 'approvedBy:id,name,avatar', 'user:id,name,avatar']);
            resolve(\App\Services\TelegramService::class)->broadcast('inventory.stock_transfer', $transfer);

            return response()->json($transfer);
        });
    }

    public function reject(Request $request, $id)
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending transfers can be rejected'], 422);
        }

        $request->validate(['reason' => 'required|string']);

        $transfer->update([
            'status' => 'REJECTED',
            'rejected_by_id' => Auth::id(),
            'rejected_at' => now(),
            'rejected_reason' => $request->reason,
        ]);

        return response()->json($transfer->load(['items.product:id,code,name', 'fromLocation:id,name', 'toLocation:id,name', 'rejectedBy:id,name,avatar']));
    }

    public function destroy($id)
    {
        $transfer = StockTransfer::findOrFail($id);

        if ($transfer->status !== 'DRAFT') {
            return response()->json(['message' => 'Cannot delete a non-draft transfer'], 422);
        }

        $transfer->delete();
        return response()->json(['message' => 'Transfer deleted successfully']);
    }
}


