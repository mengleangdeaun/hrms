<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Holiday extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'category',
        'start_date',
        'end_date',
        'description',
        'is_paid',
        'is_half_day',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_paid' => 'boolean',
        'is_half_day' => 'boolean',
    ];

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'holiday_branch');
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'holiday_employee');
    }
}
