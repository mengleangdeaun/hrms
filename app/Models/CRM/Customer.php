<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Traits\LogsSystemActivity;
use App\Models\CRM\CustomerType;
use App\Models\CRM\CustomerVehicle;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class Customer extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes, LogsSystemActivity, Notifiable;
    
    protected static function booted()
    {
        static::creating(function ($customer) {
            $numberService = app(\App\Services\DocumentNumberService::class);
            if (!$customer->customer_code) {
                $customer->customer_code = $numberService->generate('customer_code');
            }
            if (!$customer->customer_no) {
                $customer->customer_no = $numberService->generate('customer');
            }
        });
    }

    protected $fillable = [
        'customer_code',
        'customer_no',
        'type',
        'name',
        'company_name',
        'parent_id',
        'phone',
        'email',
        'address',
        'telegram_user_id',
        'joined_at',
        'customer_type_id',
        'status',
        'notes',
        'image',
        'tma_notifications_enabled',
        'source',
    ];

    protected $appends = [
        'image_url',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function customer_type()
    {
        return $this->belongsTo(CustomerType::class, 'customer_type_id');
    }

    public function parent()
    {
        return $this->belongsTo(Customer::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Customer::class, 'parent_id');
    }

    public function vehicles()
    {
        return $this->hasMany(CustomerVehicle::class);
    }
    public function broadcasts()
    {
        return $this->belongsToMany(\App\Models\TmaBroadcast::class, 'tma_broadcast_customer', 'customer_id', 'broadcast_id')
            ->withPivot(['is_viewed', 'viewed_at', 'is_clicked', 'clicked_at'])
            ->withTimestamps();
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image) return null;
        if (filter_var($this->image, FILTER_VALIDATE_URL) || str_starts_with($this->image, '/')) {
            return $this->image;
        }
        return Storage::url($this->image);
    }

    public function ratings()
    {
        return $this->hasMany(\App\Models\Workshop\JobCardRating::class);
    }
}
