<?php

namespace App\Models\QualityControl;

use App\Models\HR\Employee;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class JobCardQCItem extends Model
{
    use HasFactory;

    protected $table = 'job_card_qc_items';

    protected $fillable = [
        'qc_report_id',
        'job_card_item_id',
        'rating',
        'status',
        'damage_type_id',
        'rework_technician_id',
        'notes'
    ];

    public function qcReport()
    {
        return $this->belongsTo(\App\Models\QualityControl\JobCardQCReport::class, 'qc_report_id');
    }

    public function jobCardItem()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCardItem::class);
    }

    public function damageType()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCardDamageType::class, 'damage_type_id');
    }

    public function reworkTechnician()
    {
        return $this->belongsTo(\App\Models\HR\Employee::class, 'rework_technician_id');
    }
}



