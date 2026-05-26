<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::with('parent')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:inventory_categories,id',
            'code' => 'required|string|unique:inventory_categories,code',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category = Category::create($validated);
        return response()->json($category->load('parent'), 201);
    }

    public function show($id)
    {
        return response()->json(Category::with(['parent', 'children'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'parent_id' => 'nullable|exists:inventory_categories,id',
            'code' => 'sometimes|required|string|unique:inventory_categories,code,' . $category->id,
            'name' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $category->update($validated);
        return response()->json($category->load('parent'));
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }
}


