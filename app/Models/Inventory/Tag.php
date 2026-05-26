<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Tag extends Model
{
    protected $table = 'inventory_tags';

    use HasFactory, LogsSystemActivity;

    protected $fillable = ['name', 'color', 'is_active'];
}

