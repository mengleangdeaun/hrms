<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemActivityLog extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $table = 'system_activity_logs';

    public $guarded = [];

    protected $casts = [
        'properties' => 'collection',
    ];

    /**
     * Get the subject of the activity.
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Get the causer of the activity.
     */
    public function causer()
    {
        return $this->morphTo();
    }
}



