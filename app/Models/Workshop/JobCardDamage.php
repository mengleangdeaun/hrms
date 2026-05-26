<?php

namespace App\Models\Workshop;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class JobCardDamage extends Model
{
    use HasFactory;

    protected $table = 'job_card_damages';

    protected $fillable = [
        'job_card_id',
        'sales_order_id',
        'job_card_item_id',
        'qc_report_id',
        'mistake_staff_ids',
        'rework_staff_ids',
        'damage_type_id',
        'serial_id',
        'width',
        'height',
        'quantity',
        'rating',
        'notes',
        'incident_phase',
        'status'
    ];

    protected $casts = [
        'mistake_staff_ids' => 'array',
        'rework_staff_ids' => 'array',
        'rating' => 'integer',
        'width' => 'decimal:4',
        'height' => 'decimal:4',
        'quantity' => 'decimal:4',
    ];

    public function serial()
    {
        return $this->belongsTo(\App\Models\Inventory\ProductSerial::class, 'serial_id');
    }

    public function jobCard()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCard::class);
    }

    public function jobCardItem()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCardItem::class);
    }

    public function qcReport()
    {
        return $this->belongsTo(\App\Models\QualityControl\JobCardQCReport::class, 'qc_report_id');
    }

    public function damageType()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCardDamageType::class, 'damage_type_id');
    }
}



