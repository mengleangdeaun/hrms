<?php

namespace App\Models\Stock;

use App\Models\HR\Branch;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Location extends Model
{
    protected $table = 'inventory_locations';

    use HasFactory, LogsSystemActivity;

    protected $fillable = ['name', 'description', 'address', 'is_active', 'is_primary', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class);
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'location_id');
    }
}


