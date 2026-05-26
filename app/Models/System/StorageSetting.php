<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StorageSetting extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'provider', // 'local', 's3', 'gdrive'
        'is_active',
        'credentials', // json string
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'credentials' => 'array',
    ];
}



