<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

use App\Channels\PwaDatabaseChannel;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class PwaNotification extends Notification implements ShouldQueue, ShouldBroadcastNow
{
    use Queueable;

    protected $payload;

    /**
     * Create a new notification instance.
     * 
     * @param array $payload Must include: type, title, message, and optional data array.
     */
    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $channels = [PwaDatabaseChannel::class, 'broadcast'];

        // Add WebPush if the notifiable has push subscriptions
        if (method_exists($notifiable, 'pushSubscriptions') && $notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => $this->payload['type'] ?? 'general',
            'app_category' => 'pwa',
            'title' => $this->payload['title'] ?? 'System Notification',
            'message' => $this->payload['message'] ?? '',
            'pwa_display_type' => $this->payload['pwa_display_type'] ?? 'standard',
            'data' => array_merge($this->payload['data'] ?? [], [
                'featured_image_url' => $this->payload['data']['featured_image_url'] ?? null,
                'has_attachments' => $this->payload['data']['has_attachments'] ?? false,
                'pwa_action_url' => $this->payload['pwa_action_url'] ?? $this->payload['data']['pwa_action_url'] ?? null,
            ]),
            'employee_id' => ($notifiable instanceof \App\Models\HR\Employee) ? $notifiable->id : null,
        ];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $data = $this->toDatabase($notifiable);
        return new BroadcastMessage(array_merge($data, [
            'id' => $this->id,
            'read_at' => null,
            'created_at' => now()->toDateTimeString(),
        ]));
    }

    /**
     * Get the web push representation of the notification.
     */
    public function toWebPush(object $notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title($this->payload['title'] ?? 'SCCG')
            ->icon('/favicon.svg')
            ->body($this->payload['message'] ?? '')
            ->data(['url' => $this->payload['pwa_action_url'] ?? '/'])
            ->badge('/favicon.svg')
            ->vibrate([100, 50, 100]);
    }
}
