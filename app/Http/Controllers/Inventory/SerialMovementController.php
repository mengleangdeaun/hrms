<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\SerialMovement;
use Illuminate\Http\Request;

class SerialMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->applyFilters(SerialMovement::with([
            'product:id,name,code', 
            'location:id,name', 
            'user:id,name', 
            'serial:id,serial_number'
        ]), $request);
        
        $perPage = $request->input('per_page', 15);
        $movements = $query->orderBy('created_at', 'desc')
                           ->orderBy('id', 'desc')
                           ->paginate($perPage);

        return response()->json($movements);
    }

    /**
     * Export serial movements to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->applyFilters(SerialMovement::with([
            'product:id,name,code', 
            'location:id,name', 
            'user:id,name', 
            'serial:id,serial_number'
        ]), $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=serial_movements_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Date', 'Product', 'Serial Number', 'Location', 'Type', 'Reference', 'User'];

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
                        $m->serial->serial_number ?? 'N/A',
                        $m->location->name ?? 'N/A',
                        $m->movement_type,
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
                            $m->serial->serial_number ?? 'N/A',
                            $m->location->name ?? 'N/A',
                            $m->movement_type,
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
                })->orWhereHas('serial', function($sq) use ($search) {
                    $sq->where('serial_number', 'like', "%{$search}%");
                })->orWhere('reason', 'like', "%{$search}%");
            });
        }

        if ($request->filled('serial_id')) {
            $query->where('serial_id', $request->serial_id);
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
        $movement = SerialMovement::with(['product', 'location', 'user', 'serial', 'reference'])->findOrFail($id);
        return response()->json($movement);
    }
}


