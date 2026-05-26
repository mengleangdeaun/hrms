<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;
use App\Traits\LogsSystemActivity;

class Notification extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'employee_id',
        'notifiable_id',
        'notifiable_type',
        'type',
        'app_category',
        'pwa_display_type',
        'title',
        'message',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function markAsRead(): void
    {
        $this->update(['read_at' => now()]);
    }

    /**
     * Ensure data is always an array (handles double-encoded JSON gracefully)
     */
    public function getDataAttribute($value)
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return is_array($value) ? $value : [];
    }
}



