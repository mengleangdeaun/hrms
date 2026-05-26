<?php

namespace App\Notifications\CRM;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Channels\PwaDatabaseChannel;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class LeadAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lead;
    protected $assigner;

    /**
     * Create a new notification instance.
     */
    public function __construct($lead, $assigner)
    {
        $this->lead = $lead;
        $this->assigner = $assigner;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [PwaDatabaseChannel::class, 'broadcast'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'crm_assigned',
            'app_category' => 'crm',
            'title' => 'New Lead Assigned',
            'message' => "{$this->assigner->name} assigned a new lead to you: \"{$this->lead->title}\"",
            'data' => [
                'type' => 'crm_assigned',
                'lead_id' => $this->lead->id,
                'lead_ulid' => $this->lead->ulid ?? $this->lead->id,
                'assigner_name' => $this->assigner->name,
                'lead_name' => $this->lead->title,
                'action_url' => "/dashboard/leads?lead_id=" . ($this->lead->ulid ?? $this->lead->id),
            ]
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $data = $this->toArray($notifiable);
        return new BroadcastMessage(array_merge($data, [
            'id' => $this->id,
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]));
    }
}
