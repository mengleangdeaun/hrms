<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Department;
use Illuminate\Http\Request;

use App\Http\Resources\HR\DepartmentResource;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return DepartmentResource::collection(Department::with('branches:id,name')->select('id', 'name')->latest()->get());
        }
        $departments = Department::with('branches:id,name')->latest()->get();
        return DepartmentResource::collection($departments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'branch_ids' => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $department = Department::create($request->all());
        $department->branches()->sync($request->branch_ids);

        return (new DepartmentResource($department->load('branches')))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Department $department)
    {
        return new DepartmentResource($department->load('branches'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Department $department)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'branch_ids' => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $department->update($request->all());
        $department->branches()->sync($request->branch_ids);

        return new DepartmentResource($department->load('branches'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Department $department)
    {
        $department->delete();
        return response()->json(null, 204);
    }
}
