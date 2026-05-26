<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LeaveBalanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Leave\LeaveBalance::with([
            'employee:id,full_name,employee_id,profile_image',
            'leaveType:id,name,color'
        ]);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('employee', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Filters
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        } else if ($request->filled('start_date') && $request->filled('end_date')) {
            $startYear = \Illuminate\Support\Carbon::parse($request->start_date)->year;
            $endYear = \Illuminate\Support\Carbon::parse($request->end_date)->year;
            
            if ($startYear === $endYear) {
                $query->where('year', $startYear);
            } else {
                $query->whereBetween('year', [$startYear, $endYear]);
            }
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        // Sorting
        $sortField = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');

        if ($sortField === 'employee') {
            $query->join('employees', 'leave_balances.employee_id', '=', 'employees.id')
                  ->orderBy('employees.full_name', $sortDirection)
                  ->select('leave_balances.*');
        } else if ($sortField === 'leave_type') {
            $query->join('leave_types', 'leave_balances.leave_type_id', '=', 'leave_types.id')
                  ->orderBy('leave_types.name', $sortDirection)
                  ->select('leave_balances.*');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        $perPage = $request->input('per_page', 10);
        $paginatedData = $query->paginate($perPage);

        return response()->json($paginatedData);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'total_accrued' => 'required|numeric|min:0',
            'total_taken' => 'required|numeric|min:0',
            'balance' => 'required|numeric|min:0',
            'year' => 'required|integer|min:1900',
        ]);

        $balance = \App\Models\Leave\LeaveBalance::create($validated);
        return response()->json($balance->load(['employee', 'leaveType']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\Leave\LeaveBalance $leaveBalance)
    {
        return response()->json($leaveBalance->load(['employee', 'leaveType']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, \App\Models\Leave\LeaveBalance $leaveBalance)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'total_accrued' => 'required|numeric|min:0',
            'total_taken' => 'required|numeric|min:0',
            'balance' => 'required|numeric|min:0',
            'year' => 'required|integer|min:1900',
        ]);

        $leaveBalance->update($validated);
        return response()->json($leaveBalance->load(['employee', 'leaveType']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\Leave\LeaveBalance $leaveBalance)
    {
        $leaveBalance->delete();
        return response()->json(null, 204);
    }
}


