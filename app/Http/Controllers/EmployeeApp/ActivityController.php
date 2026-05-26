<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\HR\EmployeeActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ActivityController extends Controller
{
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) return null;

        // The frontend will send the raw token or 'Bearer token'
        $token = str_replace('Bearer ', '', $token);

        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    /**
     * List the authenticated employee's own activities (paginated).
     */
    public function index(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $activities = EmployeeActivity::where('employee_id', $employee->id)
            ->when($request->activity_type, function ($query, $type) {
                return $query->where('activity_type', $type);
            })
            ->when($request->date_from, function ($query, $from) {
                return $query->whereDate('activity_date', '>=', $from);
            })
            ->when($request->date_to, function ($query, $to) {
                return $query->whereDate('activity_date', '<=', $to);
            })
            ->orderByDesc('submitted_at')
            ->paginate($request->per_page ?? 15);

        return response()->json($activities);
    }

    /**
     * Submit a new activity (multiple attachments + GPS + comment).
     */
    public function store(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $request->validate([
            'activity_type' => 'required|string|max:100',
            'attachments'   => 'required|array|min:1',
            'attachments.*' => 'image|max:10240',
            'comment'       => 'nullable|string|max:1000',
            'latitude'      => 'nullable|numeric|between:-90,90',
            'longitude'     => 'nullable|numeric|between:-180,180',
            'location_name' => 'nullable|string|max:255',
        ]);

        $attachmentPaths = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                // Use public disk so files are accessible via the storage symlink
                $path = Storage::disk('public')->putFile('activities', $file);
                $attachmentPaths[] = $path;
            }
        }

        $now = Carbon::now();
        $activityDate = $request->activity_date ?: $now->toDateString();
        $submittedAt = $request->submitted_at ?: $now;

        $activity = EmployeeActivity::create([
            'employee_id'   => $employee->id,
            'activity_type' => $request->activity_type,
            'photo_path'    => !empty($attachmentPaths) ? $attachmentPaths[0] : null,
            'attachments'   => $attachmentPaths,
            'comment'       => $request->comment,
            'latitude'      => $request->latitude,
            'longitude'     => $request->longitude,
            'location_name' => $request->location_name,
            'activity_date' => $activityDate,
            'submitted_at'  => $submittedAt,
            'status'        => 'submitted',
        ]);

        // Broadcast to Telegram (Load attachments for better visibility if service supports it)
        try {
            resolve(\App\Services\TelegramService::class)->broadcast('hr.employee_activity', $activity->load('employee'));
        } catch (\Exception $e) { /* silent fail for broadcast */ }

        return response()->json(['message' => 'Activity submitted', 'activity' => $activity->load('employee')], 201);
    }
}
