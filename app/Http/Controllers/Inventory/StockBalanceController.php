<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Product;
use Illuminate\Http\Request;

class StockBalanceController extends Controller
{
    /**
     * Display a listing of products with aggregated stock levels.
     */
    public function index(Request $request)
    {
        $products = $this->getBalanceQuery($request)->get()->map(fn($p) => $this->transformProduct($p));
        return response()->json($products);
    }

    /**
     * Export stock balance to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->getBalanceQuery($request);
        
        $limit = $request->get('limit');
        $page = $request->get('page', 1);

        if ($limit) {
            $query->limit($limit)->offset(($page - 1) * $limit);
        }

        $products = $query->get()->map(fn($p) => $this->transformProduct($p));

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=stock_balance_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Product Name', 'Code', 'SKU', 'Bulk Quantity', 'Serial Quantity', 'Total Stock'];

        $callback = function() use($products, $columns, $limit, $page) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            $index = $limit ? ($page - 1) * $limit + 1 : 1;
            foreach ($products as $product) {
                fputcsv($file, [
                    $index++,
                    $product['name'],
                    $product['code'],
                    $product['sku'],
                    $product['total_bulk_qty'],
                    $product['total_serial_qty'],
                    $product['total_stock']
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function getBalanceQuery(Request $request)
    {
        $branchId = $request->input('branch_id');
        if (is_string($branchId) && str_contains($branchId, ',')) {
            $branchId = explode(',', $branchId);
        }
        $locationId = $request->input('location_id');
        $search = $request->input('search');

        $query = Product::select('id', 'name', 'code', 'sku');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        return $query->with([
                'stocks' => function($query) use ($branchId, $locationId) {
                    if ($branchId) {
                        $query->whereHas('location', function($q) use ($branchId) {
                            if (is_array($branchId)) {
                                $q->whereIn('branch_id', $branchId);
                            } else {
                                $q->where('branch_id', $branchId);
                            }
                        });
                    }
                    if ($locationId) {
                        $query->where('location_id', $locationId);
                    }
                    $query->with('location.branch');
                },
                'serials' => function($query) use ($branchId, $locationId) {
                    $query->where('status', 'Available');
                    if ($branchId) {
                        if (is_array($branchId)) {
                            $query->whereIn('branch_id', $branchId);
                        } else {
                            $query->where('branch_id', $branchId);
                        }
                    }
                    if ($locationId) {
                        $query->where('location_id', $locationId);
                    }
                    $query->with(['location', 'branch']);
                }
            ]);
    }

    private function transformProduct($product)
    {
        $totalBulkQty = $product->stocks->sum('quantity');
        $totalSerialQty = $product->serials->count();
        
        // Group by branch
        $branches = [];
        
        // 1. Process Bulk Stocks
        foreach ($product->stocks as $stock) {
            $branchId = $stock->location->branch_id;
            $branchName = $stock->location->branch->name;
            $locationId = $stock->location_id;
            $locationName = $stock->location->name;
            
            if (!isset($branches[$branchId])) {
                $branches[$branchId] = [
                    'id' => $branchId,
                    'name' => $branchName,
                    'bulk_qty' => 0,
                    'serial_qty' => 0,
                    'locations' => []
                ];
            }
            
            $branches[$branchId]['bulk_qty'] += $stock->quantity;
            
            if (!isset($branches[$branchId]['locations'][$locationId])) {
                $branches[$branchId]['locations'][$locationId] = [
                    'id' => $locationId,
                    'name' => $locationName,
                    'bulk_qty' => 0,
                    'serial_qty' => 0
                ];
            }
            $branches[$branchId]['locations'][$locationId]['bulk_qty'] += $stock->quantity;
        }
        
        // 2. Process Serials
        foreach ($product->serials as $serial) {
            $branchId = $serial->branch_id;
            if (!$branchId) continue;
            
            $branchName = $serial->branch?->name ?: 'Unknown Branch';
            $locationId = $serial->location_id;
            $locationName = $serial->location?->name ?: 'Unassigned Location';
            
            if (!isset($branches[$branchId])) {
                $branches[$branchId] = [
                    'id' => $branchId,
                    'name' => $branchName,
                    'bulk_qty' => 0,
                    'serial_qty' => 0,
                    'locations' => []
                ];
            }
            
            $branches[$branchId]['serial_qty'] += 1;
            
            if ($locationId) {
                 if (!isset($branches[$branchId]['locations'][$locationId])) {
                    $branches[$branchId]['locations'][$locationId] = [
                        'id' => $locationId,
                        'name' => $locationName,
                        'bulk_qty' => 0,
                        'serial_qty' => 0
                    ];
                }
                $branches[$branchId]['locations'][$locationId]['serial_qty'] += 1;
            }
        }

        // Convert locations object to array for each branch
        foreach ($branches as $bid => $b) {
            $branches[$bid]['locations'] = array_values($b['locations']);
        }

        return [
            'id' => $product->id,
            'name' => $product->name,
            'code' => $product->code,
            'sku' => $product->sku,
            'total_bulk_qty' => (float)$totalBulkQty,
            'total_serial_qty' => (int)$totalSerialQty,
            'total_stock' => (float)($totalBulkQty + $totalSerialQty),
            'branches' => array_values($branches),
            'serials' => $product->serials->toArray(),
        ];
    }
}


