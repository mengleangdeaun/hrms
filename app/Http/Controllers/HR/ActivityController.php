<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\EmployeeActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ActivityController extends Controller
{
    /**
     * Paginated list of all activities with filters.
     */
    public function index(Request $request)
    {
        $query = EmployeeActivity::with(['employee.branch', 'employee.designation']);

        $this->applyFilters($query, $request);

        // Sorting
        $sortBy = $request->get('sort_by', 'submitted_at');
        $sortDir = $request->get('sort_dir', 'desc');
        
        // Handle related-table sorting if needed, else default
        if ($sortBy === 'employee.full_name') {
            $query->join('employees', 'employee_activities.employee_id', '=', 'employees.id')
                  ->orderBy('employees.full_name', $sortDir)
                  ->select('employee_activities.*');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = $request->get('per_page', 20);
        $activities = $query->paginate($perPage);

        $activities->getCollection()->transform(function ($a) {
            $a->photo_url = $a->photo_url;
            return $a;
        });

        return response()->json($activities);
    }

    /**
     * Export activities to CSV.
     */
    public function export(Request $request)
    {
        $query = EmployeeActivity::with(['employee.branch', 'employee.designation']);
        $this->applyFilters($query, $request);

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=hr_activity_log_" . date('Y-m-d') . ".csv",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['#', 'Submitted At', 'Employee', 'Employee ID', 'Activity Date', 'Activity Type', 'Description', 'Status', 'Admin Note', 'Latitude', 'Longitude', 'Location'];

        $callback = function() use($query, $columns) {
            $file = fopen('php://output', 'w');
            fputs($file, "\xEF\xBB\xBF"); // Add BOM for Excel compatibility
            fputcsv($file, $columns);

            $index = 1;
            $query->orderBy('submitted_at', 'desc')->chunk(200, function($activities) use($file, &$index) {
                foreach ($activities as $activity) {
                    fputcsv($file, [
                        $index++,
                        $activity->submitted_at ? \Carbon\Carbon::parse($activity->submitted_at)->format('d-m-Y H:i') : 'N/A',
                        $activity->employee->full_name ?? 'N/A',
                        $activity->employee->employee_id ?? 'N/A',
                        $activity->activity_date ? \Carbon\Carbon::parse($activity->activity_date)->format('d-m-Y') : 'N/A',
                        $activity->activity_type,
                        $activity->description,
                        $activity->status,
                        $activity->admin_note ?? '',
                        $activity->latitude ?? '-',
                        $activity->longitude ?? '-',
                        $activity->location_name ?? '-'
                    ]);
                }
            });


            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Shared filter logic.
     */
    private function applyFilters($query, Request $request)
    {
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('branch_id')) {
            $query->whereHas('employee', fn($q) => $q->where('branch_id', $request->branch_id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('activity_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('activity_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('full_name', 'like', "%{$request->search}%")
                  ->orWhere('employee_id', 'like', "%{$request->search}%");
            });
        }
    }

    /**
     * Single activity detail.
     */
    public function show(EmployeeActivity $activity)
    {
        $activity->load('employee.branch', 'employee.designation');
        $activity->photo_url = $activity->photo_url;
        return response()->json($activity);
    }

    /**
     * Update status and/or admin note.
     */
    public function updateStatus(Request $request, EmployeeActivity $activity)
    {
        $request->validate([
            'status'     => 'required|in:submitted,reviewed,flagged',
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $activity->update([
            'status'     => $request->status,
            'admin_note' => $request->admin_note,
        ]);

        return response()->json(['message' => 'Activity updated', 'activity' => $activity]);
    }

    /**
     * Delete an activity and its photos from storage.
     */
    public function destroy(EmployeeActivity $activity)
    {
        $paths = is_array($activity->attachments) ? $activity->attachments : [];
        if (empty($paths) && $activity->photo_path) {
            $paths = [$activity->photo_path];
        }

        foreach ($paths as $path) {
            if (!$path || filter_var($path, FILTER_VALIDATE_URL)) continue;

            // Strip legacy prefixes before deletion
            $cleanPath = ltrim($path, '/');
            if (str_starts_with($cleanPath, 'storage/')) {
                $cleanPath = substr($cleanPath, 8);
            }

            Storage::delete($cleanPath);
        }

        $activity->delete();

        return response()->json(['message' => 'Activity deleted']);
    }
}
