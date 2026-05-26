<?php
// c:\laragon\www\erp\app\Events\AttendanceLogged.php

namespace App\Events;

use App\Models\Attendance\AttendanceRecord;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceLogged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $record;

    /**
     * Create a new event instance.
     */
    public function __construct(AttendanceRecord $record)
    {
        $this->record = $record->load(['employee', 'branch']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('attendance'),
        ];
    }

    /**
     * Get the event name to broadcast.
     */
    public function broadcastAs(): string
    {
        return 'AttendanceLogged';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'record' => $this->record
        ];
    }
}
