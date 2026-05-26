<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Workshop\OffCutSerial;
use Illuminate\Http\Request;

class InventoryOffCutSerialController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->applyFilters(OffCutSerial::with(['product', 'branch', 'jobCard', 'product.category', 'product.baseUom']), $request);
        
        $offCuts = $query->orderBy('created_at', 'desc')->paginate($request->get('limit', 15));

        return response()->json($offCuts);
    }

    /**
     * Export off-cut serials to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->applyFilters(OffCutSerial::with(['product', 'branch', 'jobCard']), $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=off_cut_serials_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Date Created', 'Serial Number', 'Product', 'Branch', 'Status', 'Length/Qty', 'Job Card'];

        $callback = function() use($query, $columns, $request) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            $limit = $request->get('limit');
            $page = $request->get('page', 1);
            $index = $limit ? ($page - 1) * $limit + 1 : 1;

            if ($limit) {
                $offCuts = $query->orderBy('created_at', 'desc')
                    ->limit($limit)
                    ->offset(($page - 1) * $limit)
                    ->get();
                foreach ($offCuts as $o) {
                    fputcsv($file, [
                        $index++,
                        $o->created_at->format('d-m-Y H:i'),
                        $o->serial_number,
                        $o->product->name ?? 'N/A',
                        $o->branch->name ?? 'N/A',
                        $o->status,
                        $o->quantity,
                        $o->jobCard->job_card_number ?? 'N/A'
                    ]);
                }
            } else {
                $query->orderBy('created_at', 'desc')->chunk(200, function($offCuts) use($file, &$index) {
                    foreach ($offCuts as $o) {
                        fputcsv($file, [
                            $index++,
                            $o->created_at->format('d-m-Y H:i'),
                            $o->serial_number,
                            $o->product->name ?? 'N/A',
                            $o->branch->name ?? 'N/A',
                            $o->status,
                            $o->quantity,
                            $o->jobCard->job_card_number ?? 'N/A'
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
                $q->where('serial_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%")
                         ->orWhere('sku', 'like', "%{$search}%");
                  })
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $branchId = $request->branch_id;
            if (is_string($branchId) && str_contains($branchId, ',')) {
                $branchId = explode(',', $branchId);
            }
            if (is_array($branchId)) {
                $query->whereIn('branch_id', $branchId);
            } else {
                $query->where('branch_id', $branchId);
            }
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        return $query;
    }

    public function show($id)
    {
        $offCut = OffCutSerial::with(['product', 'branch', 'jobCard.customer', 'jobCard.vehicle'])->findOrFail($id);
        return response()->json($offCut);
    }
}


