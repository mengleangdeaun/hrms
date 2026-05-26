<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class TmaBroadcast extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'message', 
        'image_url', 
        'aspect_ratio',
        'button_text',
        'button_url',
        'sender_id', 
        'total_recipients', 
        'delivered_count',
        'failed_count',
        'click_count',
        'is_archived',
        'status'
    ];

    protected $casts = [
        'is_archived' => 'boolean',
    ];

    public function customers()
    {
        return $this->belongsToMany(\App\Models\CRM\Customer::class, 'tma_broadcast_customer', 'broadcast_id', 'customer_id')
            ->withPivot(['is_viewed', 'viewed_at', 'is_clicked', 'clicked_at'])
            ->withTimestamps();
    }

    public function sender()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'sender_id');
    }
}
