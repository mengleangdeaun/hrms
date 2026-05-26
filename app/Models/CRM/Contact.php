<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Support\Facades\Storage;

class Contact extends Model
{
    use HasFactory, SoftDeletes, LogsSystemActivity, HasUlids;

    protected $table = 'crm_contacts';

    const TYPE_INDIVIDUAL = 'Individual';
    const TYPE_COMPANY = 'Company';
    const TYPE_NGO = 'NGO';
    const TYPE_GOVERNMENT = 'Government';
    const TYPE_PARTNER = 'Partner';
    const TYPE_VENDOR = 'Vendor';
    const TYPE_OTHER = 'Other';

    public static function getTypes(): array
    {
        return [
            self::TYPE_INDIVIDUAL,
            self::TYPE_COMPANY,
            self::TYPE_NGO,
            self::TYPE_GOVERNMENT,
            self::TYPE_PARTNER,
            self::TYPE_VENDOR,
            self::TYPE_OTHER,
        ];
    }

    protected $fillable = [
        'ulid',
        'category_id',
        'type',
        'name',
        'company_name',
        'parent_id',
        'position',
        'email',
        'phone',
        'google_map_link',
        'address',
        'city',
        'state',
        'country',
        'notes',
        'image',
        'is_active',
        'is_converted',
        'promoted_customer_id',
        'source',
    ];

    protected $appends = [
        'image_url',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_converted' => 'boolean',
    ];

    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    public function getRouteKeyName()
    {
        return 'ulid';
    }

    public function category()
    {
        return $this->belongsTo(ContactCategory::class, 'category_id');
    }

    public function parent()
    {
        return $this->belongsTo(Contact::class, 'parent_id', 'ulid');
    }

    public function children()
    {
        return $this->hasMany(Contact::class, 'parent_id', 'ulid');
    }

    public function attachments()
    {
        return $this->hasMany(ContactAttachment::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\CRM\Customer::class, 'promoted_customer_id');
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image) return null;
        if (filter_var($this->image, FILTER_VALIDATE_URL) || str_starts_with($this->image, '/')) {
            return $this->image;
        }
        return Storage::url($this->image);
    }
}
