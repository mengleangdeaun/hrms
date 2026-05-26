<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class StorageSetting extends Model
{
    use HasFactory;

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



