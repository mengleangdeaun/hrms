<?php

namespace App\Notifications\CRM;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Channels\PwaDatabaseChannel;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class LeadMentionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $lead;
    protected $author;
    protected $snippet;

    /**
     * Create a new notification instance.
     */
    public function __construct($lead, $author, $snippet)
    {
        $this->lead = $lead;
        $this->author = $author;
        $this->snippet = $snippet;
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
            'type' => 'crm_mention',
            'app_category' => 'crm',
            'title' => 'New Mention',
            'message' => "{$this->author->name} mentioned you in a lead note: \"{$this->snippet}\"",
            'data' => [
                'type' => 'crm_mention',
                'lead_id' => $this->lead->id,
                'lead_ulid' => $this->lead->ulid ?? $this->lead->id,
                'author_name' => $this->author->name,
                'author_avatar' => $this->author->avatar_url,
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
