<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class SerialSetting extends Model
{
    use HasFactory;

    protected $table = 'inventory_serial_settings';

    protected $fillable = [
        'branch_id',
        'prediction_mode',
        'auto_increment',
        'prefix',
        'keep_open',
    ];

    protected $casts = [
        'auto_increment' => 'boolean',
        'keep_open' => 'boolean',
    ];
}

