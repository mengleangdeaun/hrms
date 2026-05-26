<?php

namespace App\Models\Leave;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;

class LeaveType extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'max_per_year',
        'is_paid',
        'color',
        'status',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'status' => 'boolean',
        'max_per_year' => 'integer',
    ];

    public function policies()
    {
        return $this->hasMany(LeavePolicy::class);
    }

    public function balances()
    {
        return $this->hasMany(LeaveBalance::class);
    }
}


