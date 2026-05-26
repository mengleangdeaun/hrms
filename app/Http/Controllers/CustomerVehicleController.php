<?php

namespace App\Http\Controllers;

use App\Models\CRM\CustomerVehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerVehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomerVehicle::with([
            'customer:id,name,customer_code',   // 3 of 19 fields
            'brand:id,name,image',              // image needed for image_url accessor
            'model:id,name',                    // 2 of 7 fields
        ])->select([
            'id', 'customer_id', 'brand_id', 'model_id', // FKs required for eager-load matching
            'plate_number', 'vin_last_4', 'color', 'year',
            'current_mileage', 'created_at',
        ]);

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('plate_number', 'like', "%{$search}%")
                  ->orWhere('vin_last_4', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('customer_code', 'like', "%{$search}%");
                  });
            });
        }

        $paginator = $query->latest()->paginate($request->per_page ?? 15);

        // Return a lean envelope — skip the 6 URL strings + links array the frontend never reads.
        return response()->json([
            'data'         => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'from'         => $paginator->firstItem(),
            'to'           => $paginator->lastItem(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'brand_id' => 'required|exists:vehicle_brands,id',
            'model_id' => 'required|exists:vehicle_models,id',
            'plate_number' => 'nullable|string|max:20',
            'vin_last_4' => 'nullable|string|max:4',
            'color' => 'nullable|string|max:50',
            'year' => 'nullable|integer',
            'current_mileage' => 'nullable|numeric',
        ]);

        $validated['current_mileage'] = $validated['current_mileage'] ?? 0;

        return CustomerVehicle::create($validated);
    }

    public function show($id)
    {
        return CustomerVehicle::with(['customer', 'brand', 'model','plate_no'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $vehicle = CustomerVehicle::findOrFail($id);
        
        $validated = $request->validate([
            'brand_id' => 'sometimes|exists:vehicle_brands,id',
            'model_id' => 'sometimes|exists:vehicle_models,id',
            'plate_number' => 'nullable|string|max:20',
            'vin_last_4' => 'nullable|string|max:4',
            'color' => 'nullable|string|max:50',
            'year' => 'nullable|integer',
            'current_mileage' => 'nullable|numeric',
        ]);

        if (array_key_exists('current_mileage', $validated)) {
            $validated['current_mileage'] = $validated['current_mileage'] ?? 0;
        }

        $vehicle->update($validated);
        return $vehicle;
    }

    public function destroy($id)
    {
        $vehicle = CustomerVehicle::findOrFail($id);
        // Check if vehicle has job cards
        if ($vehicle->jobCards()->exists()) {
            return response()->json(['message' => 'Cannot delete vehicle with existing job cards'], 422);
        }
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle deleted successfully']);
    }
}


