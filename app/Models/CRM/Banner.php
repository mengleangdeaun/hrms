<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;

class Banner extends Model
{
    use HasFactory, SoftDeletes, LogsSystemActivity;

    protected $fillable = [
        'title',
        'description',
        'image_url',
        'link_url',
        'banner_type',
        'category_id',
        'service_id',
        'is_active',
        'sort_order',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'category_id' => 'integer',
        'service_id' => 'integer',
        'sort_order' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function service()
    {
        return $this->belongsTo(\App\Models\Workshop\Service::class, 'service_id');
    }

    public function category()
    {
        return $this->belongsTo(\App\Models\Inventory\Category::class, 'category_id');
    }

    /**
     * Scope a query to only include active banners within the date range.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                  ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', now());
            });
    }
}
