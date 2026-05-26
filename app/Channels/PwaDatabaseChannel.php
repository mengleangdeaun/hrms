<?php

namespace App\Channels;

use Illuminate\Notifications\Notification as LaravelNotification;
use App\Models\System\Notification as NotificationModel;

class PwaDatabaseChannel
{
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, LaravelNotification $notification)
    {
        // 1. Resolve Data Safely
        // We check several possible methods to extract the notification data.
        $data = [];
        if (method_exists($notification, 'toDatabase')) {
            $data = $notification->toDatabase($notifiable);
        } elseif (method_exists($notification, 'toArray')) {
            $data = $notification->toArray($notifiable);
        }
        
        // 2. Fallback to default if somehow still empty
        if (!is_array($data)) {
            $data = [];
        }

        // 3. Generate a fresh UUID for every recipient to avoid primary key collisions 
        // during bulk broadcasts (e.g. "All Employees").
        NotificationModel::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'notifiable_type' => get_class($notifiable),
            'notifiable_id' => $notifiable->id,
            'employee_id' => $data['employee_id'] ?? (($notifiable instanceof \App\Models\HR\Employee) ? $notifiable->id : null),
            'type' => $data['type'] ?? 'general',
            'app_category' => $data['app_category'] ?? 'pwa',
            'pwa_display_type' => $data['pwa_display_type'] ?? 'standard',
            'title' => $data['title'] ?? '',
            'message' => $data['message'] ?? '',
            'data' => $data['data'] ?? [],
            'read_at' => null,
        ]);
    }
}
