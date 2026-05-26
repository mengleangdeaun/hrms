<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use App\Models\Auth\User;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;
use App\Traits\LogsSystemActivity;

class Announcement extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, SoftDeletes, LogsSystemActivity;

    protected $fillable = [
        'title',
        'type',
        'short_description',
        'content',
        'start_date',
        'end_date',
        'attachments',
        'featured_image',
        'is_featured',
        'targeting_type',
        'target_ids',
        'published_at',
        'is_published',
        'status',
        'created_by',
        'notifications_sent_at',
        'send_telegram',
        'pwa_title',
        'pwa_display_type',
        'pwa_action_label',
        'pwa_action_url',
        'pwa_show_once',
        'send_notification',
        'pwa_show_title',
        'has_pwa_action',
    ];
    
    protected $appends = ['views_count', 'featured_image_url', 'attachments_with_urls'];

    protected $casts = [
        'attachments' => 'array',
        'target_ids' => 'array',
        'is_featured' => 'boolean',
        'is_published' => 'boolean',
        'send_telegram' => 'boolean',
        'send_notification' => 'boolean',
        'pwa_show_once' => 'boolean',
        'pwa_show_title' => 'boolean',
        'has_pwa_action' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'published_at' => 'datetime',
        'notifications_sent_at' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(\App\Models\Auth\User::class, 'created_by');
    }

    public function views()
    {
        return $this->hasMany(AnnouncementView::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->where('status', 'published')
            ->where(function($q) {
                $q->where('published_at', '<=', now())
                  ->orWhereNull('published_at');
            })
            ->where(function($q) {
                $q->where('start_date', '<=', now())
                  ->orWhereNull('start_date');
            })
            ->where(function($q) {
                $q->where('end_date', '>=', now())
                  ->orWhereNull('end_date');
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function getViewsCountAttribute(): int
    {
        return $this->views()->count();
    }

    public function getFeaturedImageUrlAttribute()
    {
        if (!$this->featured_image) {
            return null;
        }

        // Handle absolute URLs from Media Selector
        if (filter_var($this->featured_image, FILTER_VALIDATE_URL)) {
            return $this->featured_image;
        }

        return \Illuminate\Support\Facades\Storage::url($this->featured_image);
    }

    public function getAttachmentsWithUrlsAttribute()
    {
        $attachments = $this->attachments;
        if (!is_array($attachments)) {
            return [];
        }

        return array_map(function ($file) {
            if (isset($file['path'])) {
                // If it's already a full URL, use it directly
                if (filter_var($file['path'], FILTER_VALIDATE_URL)) {
                    $file['url'] = $file['path'];
                } else {
                    $file['url'] = \Illuminate\Support\Facades\Storage::url($file['path']);
                }
            }
            return $file;
        }, $attachments);
    }
}




