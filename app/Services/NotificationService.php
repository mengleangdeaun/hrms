<?php

namespace App\Services;

use App\Models\System\Announcement;
use App\Models\HR\Employee;
use App\Models\System\Notification;
use Illuminate\Support\Str;

use App\Notifications\PwaNotification;

class NotificationService
{
    /**
     * Dispatch in-app notifications when a leave request is submitted.
     */
    public static function leaveRequested(\App\Models\Leave\LeaveRequest $request): void
    {
        $employee = $request->employee;
        if (!$employee) return;

        $approverId = $request->approved_by;
        if (!$approverId) return;

        $approver = Employee::find($approverId);
        if ($approver) {
            $approver->notify(new PwaNotification([
                'type' => 'leave_request',
                'title' => 'notif_leave_request_title',
                'message' => 'notif_leave_request_message',
                'data' => [
                    'leave_request_id' => $request->id,
                    'placeholders' => [
                        'employee' => $employee->full_name,
                        'leave_type' => $request->leaveType?->name ?? 'Leave'
                    ]
                ],
                'pwa_action_url' => '/employee/leave?tab=approvals',
            ]));
        }
    }

    /**
     * Notify employee when their leave is approved.
     */
    public static function leaveApproved(\App\Models\Leave\LeaveRequest $request): void
    {
        $employee = $request->employee;
        $leaveType = trim(Str::replaceLast('Leave', '', $request->leaveType?->name ?? 'Leave'));
        
        if ($employee) {
            $employee->notify(new PwaNotification([
                'type' => 'leave_approved',
                'title' => 'notif_leave_approved_title',
                'message' => 'notif_leave_approved_message',
                'data' => [
                    'leave_request_id' => $request->id,
                    'placeholders' => [
                        'leave_type' => $leaveType
                    ]
                ],
                'pwa_action_url' => '/employee/leave',
            ]));
        }
    }

    /**
     * Notify employee when their leave is rejected.
     */
    public static function leaveRejected(\App\Models\Leave\LeaveRequest $request): void
    {
        $employee = $request->employee;
        $leaveType = trim(Str::replaceLast('Leave', '', $request->leaveType?->name ?? 'Leave'));
        $reason = $request->rejection_reason;

        if ($employee) {
            $employee->notify(new PwaNotification([
                'type' => 'leave_rejected',
                'title' => 'notif_leave_rejected_title',
                'message' => 'notif_leave_rejected_message',
                'data' => [
                    'leave_request_id' => $request->id,
                    'placeholders' => [
                        'leave_type' => $leaveType,
                        'reason' => $reason ? " Reason: {$reason}" : ''
                    ]
                ],
                'pwa_action_url' => '/employee/leave',
            ]));
        }
    }

    /**
     * Dispatch notifications for an announcement to all targeted employees.
     */
    public static function dispatchAnnouncement(Announcement $announcement): void
    {
        $employees = self::resolveTargetedEmployees($announcement);

        foreach ($employees as $emp) {
            $emp->notify(new PwaNotification([
                'type' => 'announcement',
                'title' => $announcement->title,
                'message' => $announcement->short_description,
                'pwa_display_type' => $announcement->pwa_display_type ?? 'standard',
                'featured_image_url' => $announcement->featured_image_url,
                'data' => [
                    'announcement_id' => $announcement->id,
                    'featured_image' => $announcement->featured_image,
                    'has_attachments' => !empty($announcement->attachments)
                ],
                'pwa_action_url' => $announcement->pwa_action_url ?? "/employee/announcements/{$announcement->id}"
            ]));
        }
    }


    /**
     * Resolve target employees based on announcement targeting settings.
     */
    public static function resolveTargetedEmployees(Announcement $announcement): \Illuminate\Support\Collection
    {
        return match($announcement->targeting_type) {
            'branch' => Employee::whereIn('branch_id', $announcement->target_ids ?? [])->get(),
            'department' => Employee::whereIn('department_id', $announcement->target_ids ?? [])->get(),
            'employee' => Employee::whereIn('id', $announcement->target_ids ?? [])->get(),
            default => Employee::all(), // 'all'
        };
    }

    /**
     * Dispatch announcement to Telegram.
     */
    public static function dispatchTelegram(Announcement $announcement): void
    {
        if (!$announcement->send_telegram) {
            return;
        }

        $service = new TelegramService();
        $setting = \App\Models\Communication\TelegramSetting::instance();
        $message = $service->formatAnnouncementMessage($announcement);

        match($announcement->targeting_type) {
            'branch' => \App\Models\HR\Branch::whereIn('id', $announcement->target_ids ?? [])->get()
                ->each(function ($b) use ($message) {
                    if ($b->telegram_chat_id) {
                        (new TelegramService($b->id))->sendMessage($b->telegram_chat_id, $message, $b->telegram_topic_id);
                    }
                }),
            'department' => \App\Models\HR\Department::whereIn('id', $announcement->target_ids ?? [])->with('branches')->get()
                ->each(function ($d) use ($message) {
                    if ($d->telegram_chat_id) {
                        $branchId = $d->branches->first()?->id;
                        (new TelegramService($branchId))->sendMessage($d->telegram_chat_id, $message, $d->telegram_topic_id);
                    }
                }),
            default => (new TelegramService())->sendMessage($setting?->global_chat_id ?? '', $message, $setting?->global_topic_id),
        };
    }

    /**
     * Recall (delete) all notifications associated with an announcement.
     */
    public static function recallAnnouncement(int $announcementId): void
    {
        Notification::where('type', 'announcement')
            ->where('data->announcement_id', $announcementId)
            ->delete();
    }

    /**
     * Dispatch notifications for shift activities (Open/Close).
     */
    public static function shiftActivity(\App\Models\Sales\SaleShift $shift): void
    {
        $actionKey = $shift->status === 'open' ? 'sales.shift_opened' : 'sales.shift_closed';
        
        // Broadcast to Telegram
        (new TelegramService($shift->branch_id))->broadcast($actionKey, $shift);
    }

    // ── Day Off Notifications ────────────────────────────────────────

    /**
     * Notify admin/line-manager when employee submits a day-off change request.
     */
    public static function dayOffRequested(\App\Models\HR\DayOffRequest $request): void
    {
        $employee = $request->employee;
        if (!$employee) return;

        // Notify the employee's line manager (if exists)
        $managerId = $employee->line_manager_id ?? null;
        if ($managerId) {
            $manager = Employee::find($managerId);
            if ($manager) {
                $manager->notify(new PwaNotification([
                    'type'    => 'day_off_request',
                    'title'   => 'notif_day_off_request_title',
                    'message' => 'notif_day_off_request_message',
                    'data'    => [
                        'day_off_request_id' => $request->id,
                        'placeholders' => [
                            'employee' => $employee->full_name
                        ]
                    ],
                    'pwa_action_url' => '/employee/day-off?tab=approvals',
                ]));
            }
        }
    }

    /**
     * Notify employee when their day-off request is approved.
     */
    public static function dayOffApproved(\App\Models\HR\DayOffRequest $request): void
    {
        $employee = $request->employee;
        if (!$employee) return;

        $daysStr = implode(', ', $request->requested_days_off ?? []);

        $employee->notify(new PwaNotification([
            'type'    => 'day_off_approved',
            'title'   => 'notif_day_off_approved_title',
            'message' => 'notif_day_off_approved_message',
            'data'    => [
                'day_off_request_id' => $request->id,
                'placeholders' => [
                    'days' => $request->requested_days_off ?? []
                ]
            ],
            'pwa_action_url' => '/employee/day-off',
        ]));
    }

    /**
     * Notify employee when their day-off request is rejected.
     */
    public static function dayOffRejected(\App\Models\HR\DayOffRequest $request): void
    {
        $employee = $request->employee;
        if (!$employee) return;

        $reason = $request->rejection_reason;

        $employee->notify(new PwaNotification([
            'type'    => 'day_off_rejected',
            'title'   => 'notif_day_off_rejected_title',
            'message' => 'notif_day_off_rejected_message',
            'data'    => [
                'day_off_request_id' => $request->id,
                'placeholders' => [
                    'reason' => $reason ? " Reason: {$reason}" : ''
                ]
            ],
            'pwa_action_url' => '/employee/day-off',
        ]));
    }

    /**
     * Notify employee when admin assigns them a new day off.
     */
    public static function dayOffAssigned(\App\Models\HR\EmployeeDayOff $dayOff): void
    {
        $employee = $dayOff->employee;
        if (!$employee) return;

        $daysStr = implode(', ', $dayOff->days_off ?? []);

        $employee->notify(new PwaNotification([
            'type'    => 'day_off_assigned',
            'title'   => 'notif_day_off_assigned_title',
            'message' => 'notif_day_off_assigned_message',
            'data'    => [
                'day_off_id' => $dayOff->id,
                'placeholders' => [
                    'days' => $dayOff->days_off ?? []
                ]
            ],
            'pwa_action_url' => '/employee/day-off',
        ]));
    }
}

