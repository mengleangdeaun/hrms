<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index()
    {
        return response()->json(Tag::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:inventory_tags,name',
            'color' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        return response()->json(Tag::create($validated), 201);
    }

    public function show($id)
    {
        return response()->json(Tag::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $tag = Tag::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|unique:inventory_tags,name,' . $tag->id,
            'color' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $tag->update($validated);
        return response()->json($tag);
    }

    public function destroy($id)
    {
        Tag::findOrFail($id)->delete();
        return response()->json(['message' => 'Tag deleted successfully']);
    }
}


