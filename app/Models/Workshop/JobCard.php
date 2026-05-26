<?php

namespace App\Models\Workshop;

use App\Models\HR\Employee;
use App\Models\HR\Branch;
use App\Models\CRM\Customer;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;

use App\Traits\ScopesByBranch;

class JobCard extends Model
{
    use HasFactory, SoftDeletes, LogsSystemActivity, ScopesByBranch;

    protected $fillable = [
        'job_no',
        'warranty_no',
        'sales_order_id',
        'branch_id',
        'customer_id',
        'vehicle_id',
        'mileage_in',
        'started_at',
        'completed_at',
        'status',
        'notes',
        'type',
        'parent_id',
        'damage_type_id',
        'technician_lead_id'
    ];

    protected $appends = [
        'qc_inspector_name',
        'qc_inspector_id',
        'qc_inspector_avatar',
    ];

    public function getQcInspectorNameAttribute()
    {
        return $this->qcReport?->qcPerson?->full_name;
    }

    public function getQcInspectorIdAttribute()
    {
        return $this->qcReport?->qcPerson?->employee_id;
    }

    public function getQcInspectorAvatarAttribute()
    {
        return $this->qcReport?->qcPerson?->profile_image_url;
    }

    public function order()
    {
        return $this->belongsTo(\App\Models\Sales\SalesOrder::class, 'sales_order_id');
    }

    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\CRM\Customer::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(\App\Models\CRM\CustomerVehicle::class, 'vehicle_id');
    }

    public function items()
    {
        return $this->hasMany(\App\Models\Workshop\JobCardItem::class);
    }

    public function materialUsage()
    {
        return $this->hasMany(\App\Models\Workshop\JobCardMaterialUsage::class);
    }

    public function parent()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCard::class, 'parent_id');
    }

    public function replacements()
    {
        return $this->hasMany(\App\Models\Workshop\JobCard::class, 'parent_id');
    }

    public function damageType()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCardDamageType::class, 'damage_type_id');
    }

    public function leadTechnician()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class, 'technician_lead_id');
    }

    public function rating()
    {
        return $this->hasOne(\App\Models\Workshop\JobCardRating::class);
    }

    public function qcReport()
    {
        return $this->hasOne(\App\Models\QualityControl\JobCardQCReport::class, 'job_card_id');
    }
}



