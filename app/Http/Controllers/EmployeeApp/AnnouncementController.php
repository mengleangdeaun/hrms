<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\System\Announcement;
use App\Models\System\AnnouncementView;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    private function resolveEmployee(Request $request)
    {
        $token = $request->bearerToken();
        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    /**
     * List published announcements visible to this employee.
     */
    public function index(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $announcements = Announcement::published()
            ->where(function ($q) use ($employee) {
                $q->where('targeting_type', 'all')
                  ->orWhere(function ($q2) use ($employee) {
                      $q2->where('targeting_type', 'branch')
                         ->whereJsonContains('target_ids', $employee->branch_id);
                  })
                  ->orWhere(function ($q2) use ($employee) {
                      $q2->where('targeting_type', 'department')
                         ->whereJsonContains('target_ids', $employee->department_id);
                  })
                  ->orWhere(function ($q2) use ($employee) {
                      $q2->where('targeting_type', 'employee')
                         ->whereJsonContains('target_ids', $employee->id);
                  });
            })
            ->orderByDesc('published_at')
            ->get([
                'id', 'title', 'pwa_title', 'type', 'short_description', 'is_featured', 
                'published_at', 'start_date', 'end_date', 'featured_image',
                'pwa_display_type', 'pwa_action_label', 'pwa_action_url', 
                'pwa_show_once', 'pwa_show_title', 'has_pwa_action', 'targeting_type'
            ]);
        
        $announcements->each(function($a) {
            $a->append('featured_image_url');
        });

        return response()->json($announcements);
    }

    /**
     * Get unread featured announcements for popup on app open.
     */
    public function featured(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $viewedIds = AnnouncementView::where('employee_id', $employee->id)->pluck('announcement_id');

        $featured = Announcement::published()
            ->featured()
            ->whereNotIn('id', $viewedIds)
            ->where(function ($q) use ($employee) {
                $q->where('targeting_type', 'all')
                  ->orWhere(fn ($q2) => $q2->where('targeting_type', 'branch')->whereJsonContains('target_ids', $employee->branch_id))
                  ->orWhere(fn ($q2) => $q2->where('targeting_type', 'department')->whereJsonContains('target_ids', $employee->department_id))
                  ->orWhere(fn ($q2) => $q2->where('targeting_type', 'employee')->whereJsonContains('target_ids', $employee->id));
            })
            ->first();

        return response()->json($featured);
    }

    /**
     * Get a single announcement and record view.
     */
    public function show(Request $request, $id)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) {
            \Log::warning("Announcement show: Unauthorized request for ID: $id");
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Find by ID first to confirm existence and visibility
        $announcement = Announcement::published()->find($id);
        
        if (!$announcement) {
            \Log::warning("Announcement not found or not currently visible for ID: $id");
            return response()->json(['message' => 'Announcement not found or no longer available.'], 404);
        }

        // Security check: Ensure employee is among targets
        $targetIds = $announcement->target_ids ?? [];
        $isTargeted = match($announcement->targeting_type) {
            'branch' => in_array((string)$employee->branch_id, array_map('strval', $targetIds)),
            'department' => in_array((string)$employee->department_id, array_map('strval', $targetIds)),
            'employee' => in_array((string)$employee->id, array_map('strval', $targetIds)),
            default => true, // 'all'
        };

        if (!$isTargeted) {
            \Log::warning("Announcement $id access denied for employee {$employee->id} (Targeting: {$announcement->targeting_type})");
            return response()->json(['message' => 'You are not authorized to view this announcement.'], 403);
        }

        // Record view (once per employee per announcement)
        AnnouncementView::firstOrCreate(
            ['announcement_id' => $announcement->id, 'employee_id' => $employee->id],
            ['viewed_at' => now()]
        );

        // Ensure virtual attributes are included
        $announcement->append(['featured_image_url', 'attachments_with_urls']);

        return response()->json($announcement);
    }
}
