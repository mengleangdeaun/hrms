<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Uom extends Model
{
    protected $table = 'inventory_uoms';

    use HasFactory, LogsSystemActivity;

    protected $fillable = ['code', 'name', 'is_active'];
}

