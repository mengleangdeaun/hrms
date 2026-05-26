<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\ContactCategory;
use Illuminate\Http\Request;

class ContactCategoryController extends Controller
{
    public function index()
    {
        return ContactCategory::orderBy('name')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:crm_contact_categories,slug',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        return ContactCategory::create($validated);
    }

    public function update(Request $request, ContactCategory $contactCategory)
    {
        if ($contactCategory->is_system && $request->has('slug') && $request->slug !== $contactCategory->slug) {
            return response()->json(['message' => 'Cannot change slug of system categories.'], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:crm_contact_categories,slug,' . $contactCategory->id,
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $contactCategory->update($validated);
        return $contactCategory;
    }


    public function destroy(ContactCategory $contactCategory)
    {
        if ($contactCategory->is_system) {
            return response()->json(['message' => 'Cannot delete system categories.'], 422);
        }

        if ($contactCategory->contacts()->exists()) {
            return response()->json(['message' => 'Cannot delete category that has contacts linked to it.'], 422);
        }

        $contactCategory->delete();
        return response()->json(null, 204);
    }

}
