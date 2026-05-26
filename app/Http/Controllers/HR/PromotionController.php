<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Promotion;
use App\Models\HR\SalaryMovement;
use App\Models\HR\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = Promotion::with([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ])->latest()->get();

        return response()->json($promotions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'              => 'required|exists:employees,id',
            'previous_designation_id'  => 'required|exists:designations,id',
            'new_designation_id'       => 'required|exists:designations,id|different:previous_designation_id',
            'promotion_date'           => 'required|date',
            'effective_date'           => 'required|date',
            'new_salary'               => 'nullable|numeric',
            'reason'                   => 'nullable|string',
            'document'                 => 'nullable',
            'status'                   => 'required|in:pending,approved,rejected',
        ]);

        if ($request->hasFile('document')) {
            $validated['document'] = $request->file('document')->store('promotions/documents', 'public');
        } else {
            $validated['document'] = $this->resolvePath($request->document);
        }

        $promotion = Promotion::create($validated);
        
        // Sync with Salary Movement
        $this->syncSalaryMovement($promotion);

        $promotion->load([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ]);

        return response()->json($promotion, 201);
    }

    public function show(Promotion $promotion)
    {
        $promotion->load([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ]);
        return response()->json($promotion);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'employee_id'              => 'required|exists:employees,id',
            'previous_designation_id'  => 'required|exists:designations,id',
            'new_designation_id'       => 'required|exists:designations,id|different:previous_designation_id',
            'promotion_date'           => 'required|date',
            'effective_date'           => 'required|date',
            'new_salary'               => 'nullable|numeric',
            'reason'                   => 'nullable|string',
            'document'                 => 'nullable',
            'status'                   => 'required|in:pending,approved,rejected',
        ]);

        if ($request->hasFile('document')) {
            // Delete old file if it exists and is internal
            $oldPath = $promotion->getRawOriginal('document');
            if ($oldPath && !filter_var($oldPath, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($oldPath);
            }
            $validated['document'] = $request->file('document')->store('promotions/documents', 'public');
        } else {
            $validated['document'] = $this->resolvePath($request->document);
        }

        $promotion->update($validated);

        // Sync with Salary Movement
        $this->syncSalaryMovement($promotion);

        $promotion->load([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ]);

        return response()->json($promotion);
    }

    /**
     * Resolve incoming media (URL or Path) to a clean database path
     */
    private function resolvePath($value)
    {
        if (empty($value)) return null;
        if (!is_string($value)) return null;

        $path = $value;
        $storageUrl = Storage::disk('public')->url('');

        // Handle full URLs
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            if (!empty($storageUrl) && str_starts_with($path, $storageUrl)) {
                return ltrim(str_replace($storageUrl, '', $path), '/');
            }
            if (str_contains($path, '/storage/')) {
                $parts = explode('/storage/', $path);
                return ltrim(end($parts), '/');
            }
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        } elseif (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return ltrim($path, '/');
    }

    public function destroy(Promotion $promotion)
    {
        $path = $promotion->getRawOriginal('document');
        if ($path && !filter_var($path, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($path);
        }
        $promotion->delete();
        return response()->json(null, 204);
    }

    /**
     * Synchronize promotion salary data with the Salary Movements table.
     */
    private function syncSalaryMovement(Promotion $promotion)
    {
        if (!$promotion->new_salary) return;

        $employee = Employee::find($promotion->employee_id);
        $previousSalary = $employee ? $employee->base_salary : 0;
        
        SalaryMovement::updateOrCreate(
            [
                'source_id' => $promotion->id,
                'source_type' => Promotion::class,
            ],
            [
                'employee_id' => $promotion->employee_id,
                'previous_salary' => $previousSalary,
                'new_salary' => $promotion->new_salary,
                'increment_amount' => $promotion->new_salary - $previousSalary,
                'effective_date' => $promotion->effective_date,
                'type' => 'promotion',
                'status' => $promotion->status, // Sync status (pending/approved)
                'reason' => 'Promotion: ' . ($promotion->newDesignation->name ?? 'New Role'),
                'is_applied' => false, // Background job will set this to true upon applying
            ]
        );
    }
}
