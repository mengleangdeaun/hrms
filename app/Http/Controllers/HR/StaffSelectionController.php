<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Http\Resources\HR\EmployeeResource;
use Illuminate\Http\Request;

class StaffSelectionController extends Controller
{
    /**
     * List all technicians across all branches.
     */
    public function technicians(Request $request)
    {
        return $this->getFilteredStaff($request, 'is_technician');
    }

    /**
     * List all QC persons across all branches.
     */
    public function qcPersons(Request $request)
    {
        return $this->getFilteredStaff($request, 'is_qc_person');
    }

    /**
     * Shared logic for staff selection endpoints.
     */
    private function getFilteredStaff(Request $request, string $flag)
    {
        $query = Employee::withoutGlobalScope('branch_isolation')
            ->where($flag, true)
            ->where('is_active', true);

        if ($request->boolean('compact')) {
            return response()->json(
                $query->select(['id', 'full_name', 'employee_id'])
                    ->orderBy('full_name', 'asc')
                    ->get()
                    ->makeHidden(['profile_image_url', 'ulid'])
            );
        }

        $staff = $query->orderBy('full_name', 'asc')->get();
        return EmployeeResource::collection($staff);
    }
}
