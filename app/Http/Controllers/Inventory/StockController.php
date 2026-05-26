<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Stock\Stock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $query = $this->applyFilters(Stock::with(['product', 'location']), $request);
        return response()->json($query->get());
    }

    /**
     * Export current stocks to CSV.
     */
    public function export(Request $request)
    {
        $query = $this->applyFilters(Stock::with(['product', 'location.branch']), $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=current_stocks_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Product Name', 'Product Code', 'Location', 'Branch', 'Quantity'];

        $callback = function() use($query, $columns, $request) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF");
            fputcsv($file, $columns);

            $limit = $request->get('limit');
            $page = $request->get('page', 1);
            $index = $limit ? ($page - 1) * $limit + 1 : 1;

            if ($limit) {
                $stocks = $query->limit($limit)->offset(($page - 1) * $limit)->get();
                foreach ($stocks as $stock) {
                    fputcsv($file, [
                        $index++,
                        $stock->product->name ?? 'N/A',
                        $stock->product->code ?? 'N/A',
                        $stock->location->name ?? 'N/A',
                        $stock->location->branch->name ?? 'N/A',
                        $stock->quantity
                    ]);
                }
            } else {
                $query->chunk(200, function($stocks) use($file, &$index) {
                    foreach ($stocks as $stock) {
                        fputcsv($file, [
                            $index++,
                            $stock->product->name ?? 'N/A',
                            $stock->product->code ?? 'N/A',
                            $stock->location->name ?? 'N/A',
                            $stock->location->branch->name ?? 'N/A',
                            $stock->quantity
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
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('location_id')) {
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

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:inventory_products,id',
            'location_id' => 'required|exists:inventory_locations,id',
            'quantity' => 'required|numeric'
        ]);

        // Upsert logic for stock addition
        $stock = Stock::updateOrCreate(
            ['product_id' => $validated['product_id'], 'location_id' => $validated['location_id']],
            ['quantity' => \DB::raw("quantity + " . $validated['quantity'])]
        );

        // Fetch fresh object to hydrate the raw computation
        $stock = Stock::find($stock->id);

        return response()->json($stock->load(['product', 'location']), 201);
    }

    public function adjust(Request $request, $id)
    {
        $stock = Stock::findOrFail($id);
        
        $validated = $request->validate([
            'quantity' => 'required|numeric' // Explicit hard set of quantity
        ]);

        $stock->update(['quantity' => $validated['quantity']]);
        return response()->json($stock->load(['product', 'location']));
    }
}


