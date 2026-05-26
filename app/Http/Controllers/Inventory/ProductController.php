<?php

namespace App\Http\Controllers\Inventory;

use App\Models\Stock\Stock;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageService;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\Inventory\ProductImport;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        if ($request->boolean('compact')) {
            $query = Product::select('id', 'name', 'price', 'code', 'sku', 'category_id', 'img', 'reorder_level');

            if ($request->has('branch_id')) {
                $branchId = $request->branch_id;
                $query->whereExists(function ($q) use ($branchId) {
                    $q->select(\Illuminate\Support\Facades\DB::raw(1))
                        ->from('branch_inventory_product')
                        ->whereColumn('branch_inventory_product.inventory_product_id', 'inventory_products.id')
                        ->where('branch_inventory_product.branch_id', $branchId)
                        ->where('branch_inventory_product.is_active', true);
                });

                $query->addSelect([
                    'branch_stock_qty' => Stock::select(\Illuminate\Support\Facades\DB::raw('SUM(quantity)'))
                        ->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_stocks.location_id')
                        ->where('inventory_locations.branch_id', $branchId)
                        ->where('inventory_locations.is_active', true)
                        ->whereColumn('inventory_stocks.product_id', 'inventory_products.id')
                ]);
            }

            if (!$request->has('all')) {
                $query->where('is_active', true);
            }

            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            return response()->json($query->orderBy('sort_order')->orderBy('name')->get());
        }

        $query = Product::query()
            ->with(['category', 'baseUom', 'purchaseUom', 'tags']);

        if (!$request->has('all')) {
            $query->where('is_active', true);
        }

        if ($request->has('branch_id')) {
            $branchId = $request->branch_id;
            $query->whereExists(function ($q) use ($branchId) {
                $q->select(\Illuminate\Support\Facades\DB::raw(1))
                    ->from('branch_inventory_product')
                    ->whereColumn('branch_inventory_product.inventory_product_id', 'inventory_products.id')
                    ->where('branch_inventory_product.branch_id', $branchId)
                    ->where('branch_inventory_product.is_active', true);
            });

            // Correctly add subquery for stock
            $query->addSelect([
                'branch_stock_qty' => Stock::select(\Illuminate\Support\Facades\DB::raw('SUM(quantity)'))
                    ->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_stocks.location_id')
                    ->where('inventory_locations.branch_id', $branchId)
                    ->where('inventory_locations.is_active', true)
                    ->whereColumn('inventory_stocks.product_id', 'inventory_products.id')
            ]);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $query->orderBy('sort_order')->orderBy('name');

        if ($request->has('all') || $request->paginate === 'false') {
            return \App\Http\Resources\Inventory\ProductResource::collection($query->get());
        }

        return \App\Http\Resources\Inventory\ProductResource::collection($query->paginate($request->per_page ?? 24));
    }


    public function reorder(Request $request)
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|exists:inventory_products,id',
            'orders.*.sort_order' => 'required|integer'
        ]);

        foreach ($request->orders as $order) {
            Product::where('id', $order['id'])->update(['sort_order' => $order['sort_order']]);
        }

        return response()->json(['message' => 'Products reordered successfully']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:inventory_products,code',
            'sku' => 'nullable|string|unique:inventory_products,sku',
            'barcode' => 'nullable|string|unique:inventory_products,barcode',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'base_uom_id' => 'nullable|exists:inventory_uoms,id',
            'purchase_uom_id' => 'nullable|exists:inventory_uoms,id',
            'uom_multiplier' => 'numeric',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'brand' => 'nullable|string',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'cost' => 'numeric',
            'price' => 'numeric',
            'reorder_level' => 'integer',
            'is_active' => 'boolean',
            'show_in_tma' => 'boolean',
            'img' => 'nullable',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:inventory_tags,id',
            'warranty_duration' => 'nullable|integer',
            'warranty_unit' => 'nullable|string',
            'lifespan_duration' => 'nullable|integer',
            'lifespan_unit' => 'nullable|string'
        ]);

        // Handle Image upload dynamically if sent
        $imageService = new ImageService();
        if ($request->hasFile('img')) {
            $path = $imageService->compressToWebp($request->file('img'));
            if ($path) {
                $validated['img'] = $path;
            }
        } elseif ($request->img) {
            $path = str_replace(Storage::disk('public')->url(''), '', $request->img);
            $path = ltrim($path, '/');
            $validated['img'] = $path;
        }

        $product = Product::create($validated);
        
        if (isset($validated['tags'])) {
            $product->tags()->sync($validated['tags']);
        }

        return new \App\Http\Resources\Inventory\ProductResource($product->load(['category', 'baseUom', 'purchaseUom', 'tags']));
    }

    public function show($id)
    {
        return new \App\Http\Resources\Inventory\ProductResource(Product::with(['category', 'baseUom', 'purchaseUom', 'tags', 'stocks.location'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:inventory_products,code,' . $product->id,
            'sku' => 'nullable|string|unique:inventory_products,sku,' . $product->id,
            'barcode' => 'nullable|string|unique:inventory_products,barcode,' . $product->id,
            'category_id' => 'nullable|exists:inventory_categories,id',
            'base_uom_id' => 'nullable|exists:inventory_uoms,id',
            'purchase_uom_id' => 'nullable|exists:inventory_uoms,id',
            'uom_multiplier' => 'numeric',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'brand' => 'nullable|string',
            'name' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'cost' => 'numeric',
            'price' => 'numeric',
            'reorder_level' => 'integer',
            'is_active' => 'boolean',
            'show_in_tma' => 'boolean',
            'img' => 'nullable',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:inventory_tags,id',
            'warranty_duration' => 'nullable|integer',
            'warranty_unit' => 'nullable|string',
            'lifespan_duration' => 'nullable|integer',
            'lifespan_unit' => 'nullable|string'
        ]);

        $imageService = new ImageService();
        if ($request->hasFile('img')) {
            $path = $imageService->compressToWebp($request->file('img'));
            if ($path) {
                $validated['img'] = $path;
            }
        } elseif ($request->img) {
            $path = str_replace(Storage::disk('public')->url(''), '', $request->img);
            $path = ltrim($path, '/');
            $validated['img'] = $path;
        }

        $product->update($validated);

        if (isset($validated['tags'])) {
            $product->tags()->sync($validated['tags']);
        }

        return new \App\Http\Resources\Inventory\ProductResource($product->load(['category', 'baseUom', 'purchaseUom', 'tags']));
    }

    public function destroy($id)
    {
        Product::findOrFail($id)->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls|max:10240',
        ]);

        try {
            Excel::import(new ProductImport, $request->file('file'));
            return response()->json(['message' => 'Products imported successfully']);
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errors = [];
            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'attribute' => $failure->attribute(),
                    'errors' => $failure->errors(),
                    'values' => $failure->values(),
                ];
            }
            return response()->json(['message' => 'Import validation failed', 'errors' => $errors], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    public function importTemplate()
    {
        $headers = [
            'code', 'sku', 'barcode', 'name', 'brand', 'category', 'base_uom', 'purchase_uom', 
            'uom_multiplier', 'cost', 'price', 'reorder_level', 'short_description', 'description', 
            'is_active', 'show_in_tma', 'warranty_duration', 'warranty_unit', 'lifespan_duration', 'lifespan_unit'
        ];

        $callback = function () use ($headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            
            // Add a sample row
            fputcsv($file, [
                'PRD-001', 'SKU-001', '123456789', 'Sample Product', 'Brand X', 'Electronics', 'pcs', 'pcs', 
                '1', '10.00', '25.00', '5', 'Short summary for TMA', 'Detailed description here', 
                'yes', 'no', '12', 'months', '5', 'years'
            ]);

            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="product_import_template.csv"',
        ]);
    }
}


