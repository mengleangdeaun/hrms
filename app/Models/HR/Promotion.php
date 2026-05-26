<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Promotion extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'employee_id',
        'previous_designation_id',
        'new_designation_id',
        'promotion_date',
        'effective_date',
        'new_salary',
        'reason',
        'document',
        'status',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function previousDesignation()
    {
        return $this->belongsTo(Designation::class, 'previous_designation_id');
    }

    public function newDesignation()
    {
        return $this->belongsTo(Designation::class, 'new_designation_id');
    }
}
