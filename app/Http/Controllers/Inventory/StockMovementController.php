<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Stock\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->applyFilters(StockMovement::with([
            'product:id,name,code,img', 
            'location:id,name', 
            'user:id,name', 
            'serial:id,serial_number'
        ]), $request);

        $perPage = $request->input('per_page', 15);
        $movements = $query->orderBy('created_at', 'desc')
                           ->orderBy('id', 'desc')
                           ->paginate($perPage);

        // Map serial movements to stock movements to avoid confusion between location balance and serial balance
        $movements->getCollection()->transform(function($m) {
            if ($m->serial_id) {
                $sm = \App\Models\Inventory\SerialMovement::where('reference_type', $m->reference_type)
                                    ->where('reference_id', $m->reference_id)
                                    ->where('serial_id', $m->serial_id)
                                    ->first();
                if ($sm) {
                    $m->serial_previous_quantity = $sm->previous_quantity;
                    $m->serial_current_quantity = $sm->current_quantity;
                }
            }
            return $m;
        });

        return response()->json($movements);
    }

    /**
     * Export stock movements to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->applyFilters(StockMovement::with([
            'product:id,name,code', 
            'location:id,name', 
            'user:id,name', 
            'serial:id,serial_number'
        ]), $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=stock_movements_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Date', 'Product', 'Code', 'Location', 'Type', 'Quantity', 'Reason/Reference', 'User'];

        $callback = function() use($query, $columns, $request) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            $limit = $request->get('limit');
            $page = $request->get('page', 1);
            $index = $limit ? ($page - 1) * $limit + 1 : 1;

            if ($limit) {
                $movements = $query->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->offset(($page - 1) * $limit)
                    ->get();
                
                foreach ($movements as $m) {
                    fputcsv($file, [
                        $index++,
                        $m->created_at->format('d-m-Y H:i'),
                        $m->product->name ?? 'N/A',
                        $m->product->code ?? 'N/A',
                        $m->location->name ?? 'N/A',
                        $m->movement_type,
                        $m->quantity,
                        $m->reason,
                        $m->user->name ?? 'N/A'
                    ]);
                }
            } else {
                $query->orderBy('created_at', 'desc')->chunk(200, function($movements) use($file, &$index) {
                    foreach ($movements as $m) {
                        fputcsv($file, [
                            $index++,
                            $m->created_at->format('d-m-Y H:i'),
                            $m->product->name ?? 'N/A',
                            $m->product->code ?? 'N/A',
                            $m->location->name ?? 'N/A',
                            $m->movement_type,
                            $m->quantity,
                            $m->reason,
                            $m->user->name ?? 'N/A'
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
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('product', function($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                       ->orWhere('code', 'like', "%{$search}%")
                       ->orWhere('sku', 'like', "%{$search}%");
                })->orWhere('reason', 'like', "%{$search}%")
                  ->orWhereHas('serial', function($sq) use ($search) {
                      $sq->where('serial_number', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $branchId = $request->branch_id;
            if (is_string($branchId) && str_contains($branchId, ',')) {
                $branchId = explode(',', $branchId);
            }
            $query->whereHas('location', function ($q) use ($branchId) {
                if (is_array($branchId)) {
                    $q->whereIn('branch_id', $branchId);
                } else {
                    $q->where('branch_id', $branchId);
                }
            });
        }

        if ($request->filled('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        return $query;
    }

    public function show($id)
    {
        $movement = StockMovement::with(['product', 'location', 'user', 'reference', 'serial'])->findOrFail($id);
        return response()->json($movement);
    }
}


