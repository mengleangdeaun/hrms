<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class PwaSetting extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'version',
        'privacy_policy',
        'terms_of_service',
    ];
}
