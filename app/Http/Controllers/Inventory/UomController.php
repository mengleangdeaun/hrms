<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Uom;
use Illuminate\Http\Request;

class UomController extends Controller
{
    public function index()
    {
        return response()->json(Uom::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:inventory_uoms,code',
            'name' => 'required|string',
            'is_active' => 'boolean'
        ]);

        return response()->json(Uom::create($validated), 201);
    }

    public function show($id)
    {
        return response()->json(Uom::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $uom = Uom::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:inventory_uoms,code,' . $uom->id,
            'name' => 'sometimes|required|string',
            'is_active' => 'boolean'
        ]);

        $uom->update($validated);
        return response()->json($uom);
    }

    public function destroy($id)
    {
        Uom::findOrFail($id)->delete();
        return response()->json(['message' => 'UOM deleted successfully']);
    }
}


