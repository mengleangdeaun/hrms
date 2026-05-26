<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\ProductSerial;
use Illuminate\Http\Request;
use App\Models\Workshop\JobCardMaterialUsage;
use App\Models\Stock\Stock;
use App\Models\Inventory\SerialSetting;

class InventoryProductSerialController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductSerial::with(['product', 'branch', 'location']);

        if ($request->has('branch_id') && $request->branch_id !== 'all' && $request->branch_id !== null) {
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
        if ($request->location_id && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }
        if ($request->product_id && $request->product_id !== 'all') {
            $query->where('product_id', $request->product_id);
        }
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where('serial_number', 'like', '%' . $request->search . '%');
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortDirection = $request->sort_direction ?? 'desc';

        // Map frontend sort keys to backend columns if necessary
        $sortColumn = $sortBy;
        if ($sortBy === 'product_id') {
            // Sorting by product name might require a join, but for now we'll just use product_id
            $sortColumn = 'product_id';
        }

        return $query->orderBy($sortColumn, $sortDirection)->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:inventory_products,id',
            'serial_number' => 'required|string|unique:inventory_product_serials,serial_number',
            'length' => 'required|numeric',
            'width' => 'required|numeric',
            'branch_id' => 'required|exists:branches,id',
            'location_id' => 'required|exists:inventory_locations,id',
            'notes' => 'nullable|string',
        ]);

        // Calculate Area (sqm) for the new serial record
        $area = $validated['length'] * $validated['width'];
        
        // Deduct 1 unit from bulk stock (e.g. 1 roll)
        $stock = Stock::where('product_id', $validated['product_id'])
            ->where('location_id', $validated['location_id'])
            ->first();

        if (!$stock || $stock->quantity < 1) {
            return response()->json([
                'message' => 'Insufficient bulk stock (0 units available) to serialize a new unit.'
            ], 422);
        }

        $stock->decrement('quantity', 1);

        $validated['initial_quantity'] = $area;
        $validated['current_quantity'] = $area;
        $validated['status'] = 'Available';

        $serial = ProductSerial::create($validated);
        return $serial->load(['product', 'branch', 'location']);
    }

    public function update(Request $request, $id)
    {
        $serial = ProductSerial::findOrFail($id);

        $validated = $request->validate([
            'current_quantity' => 'sometimes|numeric',
            'status' => 'sometimes|string',
            'notes' => 'nullable|string',
        ]);

        $serial->update($validated);
        return $serial->load(['product', 'branch']);
    }

    public function show($id)
    {
        return ProductSerial::with(['product', 'branch', 'location'])->findOrFail($id);
    }

    public function destroy($id)
    {
        $serial = ProductSerial::findOrFail($id);
        $serial->delete();
        return response()->json(['message' => 'Serial deleted successfully']);
    }

    public function scanLookup($serialNumber)
    {
        $serial = ProductSerial::with(['product', 'branch', 'location'])
            ->where('serial_number', $serialNumber)
            ->firstOrFail();

        $consumptionCount = \App\Models\Inventory\SerialMovement::where('serial_id', $serial->id)
            ->where('movement_type', 'JOB_CARD_CONSUMPTION')
            ->count();

        return response()->json([
            'id'                => $serial->id,
            'serial_number'     => $serial->serial_number,
            'status'            => $serial->status,
            'initial_quantity'  => $serial->initial_quantity,
            'current_quantity'  => $serial->current_quantity,
            'length'            => $serial->length,
            'width'             => $serial->width,
            'product'           => $serial->product ? ['name' => $serial->product->name, 'code' => $serial->product->code] : null,
            'branch'            => $serial->branch ? ['name' => $serial->branch->name] : null,
            'location'          => $serial->location ? ['name' => $serial->location->name] : null,
            'consumption_count' => $consumptionCount,
            'created_at'        => $serial->created_at,
        ]);
    }

    public function history($id)
    {
        return \App\Models\Inventory\SerialMovement::with(['user', 'location'])
            ->where('serial_id', $id)
            ->latest()
            ->get()
            ->map(function ($movement) {
                if ($movement->reference_type === 'Job Card' && $movement->reference_id) {
                    $jobCard = \App\Models\Workshop\JobCard::with(['customer', 'vehicle'])
                        ->find($movement->reference_id);
                    $movement->job_card = $jobCard;
                }
                return $movement;
            });
    }
    
    public function getSettings(Request $request)
    {
        $branchId = $request->branch_id;
        $settings = SerialSetting::where('branch_id', $branchId)->first();
        
        if (!$settings && $branchId) {
             $settings = SerialSetting::whereNull('branch_id')->first();
        }

        if (!$settings) {
            return response()->json([
                'prediction_mode' => 'per_product',
                'auto_increment' => true,
                'prefix' => '',
                'keep_open' => true,
            ]);
        }

        return $settings;
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'nullable',
            'prediction_mode' => 'required|string|in:off,global,per_product',
            'auto_increment' => 'required|boolean',
            'prefix' => 'nullable|string',
            'keep_open' => 'required|boolean',
        ]);

        $settings = SerialSetting::updateOrCreate(
            ['branch_id' => $validated['branch_id'] ?: null],
            $validated
        );

        return $settings;
    }

    public function suggestNext(Request $request)
    {
        $productId = $request->product_id;
        $branchId = $request->branch_id;
        
        $settings = SerialSetting::where('branch_id', $branchId)->first() 
                 ?? SerialSetting::whereNull('branch_id')->first();
        
        $mode = $settings->prediction_mode ?? 'per_product';
        $autoInc = $settings->auto_increment ?? true;
        $prefix = $settings->prefix ?? '';

        if ($mode === 'off' || !$autoInc) {
            return response()->json(['suggestion' => $prefix]);
        }

        $query = ProductSerial::query();
        if ($mode === 'per_product' && $productId) {
            $query->where('product_id', $productId);
        }
        
        $lastSerial = $query->latest('id')->value('serial_number');

        if (!$lastSerial) {
            $product = \App\Models\Inventory\Product::find($productId);
            $productPrefix = '';
            if ($product) {
                // Use code, fallback to a slugified name, or just prefix
                $productPrefix = ($product->code ?: substr(strtoupper(preg_replace('/[^a-z0-9]/i', '', $product->name)), 0, 5)) . '-';
            }
            return response()->json(['suggestion' => $productPrefix . $prefix . '001']);
        }

        // Increment logic: find numbers at the end
        if (preg_match('/^(.*?)(\d+)$/', $lastSerial, $matches)) {
            $base = $matches[1];
            $numStr = $matches[2];
            $nextNum = intval($numStr) + 1;
            // Preserve padding (e.g. 001 -> 002)
            $paddedNext = str_pad($nextNum, strlen($numStr), '0', STR_PAD_LEFT);
            
            // If the base doesn't match the required prefix, we might want to override, 
            // but for now we just follow the last one's style.
            return response()->json(['suggestion' => $base . $paddedNext]);
        }

        return response()->json(['suggestion' => $lastSerial . '-1']);
    }
}




