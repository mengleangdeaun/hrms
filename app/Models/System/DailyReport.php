<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use App\Models\HR\Branch;
use App\Models\Auth\User;

class DailyReport extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'ulid',
        'branch_id',
        'report_date',
        'data',
        'submitted_by',
        'telegram_sent',
    ];

    protected $casts = [
        'report_date' => 'date',
        'data' => 'array',
        'telegram_sent' => 'boolean',
    ];

    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
