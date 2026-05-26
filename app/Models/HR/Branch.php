<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use App\Models\Inventory\Product;

use App\Models\Stock\Location;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Branch extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city',
        'state',
        'country',
        'zip_code',
        'phone',
        'email',
        'logo_url',
        'footer_text',
        'payment_account_id',
        'lat',
        'lng',
        'allowed_radius',
        'status',
    ];

    protected $appends = [
        'telegram_chat_id',
        'telegram_topic_id',
    ];

    /**
     * Relationship to centralized Telegram settings.
     */
    public function telegramSetting()
    {
        return $this->hasOne(\App\Models\Communication\TelegramSetting::class);
    }

    /**
     * Accessor for telegram_chat_id (backward compatibility).
     */
    public function getTelegramChatIdAttribute()
    {
        return $this->telegramSetting?->global_chat_id;
    }

    /**
     * Accessor for telegram_topic_id (backward compatibility).
     */
    public function getTelegramTopicIdAttribute()
    {
        return $this->telegramSetting?->global_topic_id;
    }

    public function locations()
    {
        return $this->hasMany(\App\Models\Stock\Location::class);
    }

    public function inventoryProducts()
    {
        return $this->belongsToMany(\App\Models\Inventory\Product::class, 'branch_inventory_product', 'branch_id', 'inventory_product_id')->withPivot('is_active', 'reorder_level')->withTimestamps();
    }

    public function services()
    {
        return $this->belongsToMany(\App\Models\Workshop\Service::class, 'branch_service', 'branch_id', 'service_id')->withPivot('is_active')->withTimestamps();
    }

    public function paymentAccount()
    {
        return $this->belongsTo(\App\Models\Finance\PaymentAccount::class);
    }
}



