<?php

namespace App\Http\Controllers;

use App\Models\System\FormDocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FormDocumentTypeController extends Controller
{
    /**
     * Display a listing of form document types.
     */
    public function index(): JsonResponse
    {
        $types = FormDocumentType::withCount('templates')->orderBy('name')->get();
        return response()->json($types);
    }

    /**
     * Store a newly created form document type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:form_document_types,name',
            'is_active' => 'boolean',
        ]);

        $docType = FormDocumentType::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Document type created successfully',
            'data' => $docType
        ], 201);
    }

    /**
     * Display the specified form document type.
     */
    public function show(int $id): JsonResponse
    {
        $docType = FormDocumentType::withCount('templates')->findOrFail($id);
        return response()->json($docType);
    }

    /**
     * Update the specified form document type.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $docType = FormDocumentType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255|unique:form_document_types,name,' . $id,
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $docType->update($validated);

        return response()->json([
            'message' => 'Document type updated successfully',
            'data' => $docType
        ]);
    }

    /**
     * Remove the specified form document type.
     */
    public function destroy(int $id): JsonResponse
    {
        $docType = FormDocumentType::withCount('templates')->findOrFail($id);

        if ($docType->templates_count > 0) {
            return response()->json([
                'message' => 'Cannot delete document type that has existing templates.'
            ], 422);
        }

        $docType->delete();

        return response()->json([
            'message' => 'Document type deleted successfully'
        ]);
    }
}
