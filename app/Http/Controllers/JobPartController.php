<?php

namespace App\Http\Controllers;

use App\Models\Workshop\JobPartMaster;
use Illuminate\Http\Request;

class JobPartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return JobPartMaster::with('category')->orderBy('code')->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:inventory_categories,id',
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:job_parts_master,code',
            'type' => 'nullable|string|max:20',
            'side' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        $part = JobPartMaster::create($validated);

        return response()->json($part->load('category'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(JobPartMaster $part)
    {
        return $part->load('category');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JobPartMaster $part)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:inventory_categories,id',
            'name' => 'string|max:255',
            'code' => 'nullable|string|max:50|unique:job_parts_master,code,' . $part->id,
            'type' => 'nullable|string|max:20',
            'side' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        $part->update($validated);

        return response()->json($part->load('category'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JobPartMaster $part)
    {
        $part->delete();
        return response()->json(null, 204);
    }
}


