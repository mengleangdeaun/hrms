<?php

namespace App\Models\Workshop;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class ServicePartMapping extends Model
{
    use HasFactory;

    protected $table = 'service_parts_mapping';

    protected $fillable = ['service_id', 'part_id'];

    public function service()
    {
        return $this->belongsTo(\App\Models\Workshop\Service::class);
    }

    public function part()
    {
        return $this->belongsTo(\App\Models\Workshop\JobPartMaster::class, 'part_id');
    }
}



