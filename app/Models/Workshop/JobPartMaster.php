<?php

namespace App\Models\Workshop;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\LogsSystemActivity;

class JobPartMaster extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $table = 'job_parts_master';

    protected $fillable = ['category_id', 'name', 'code', 'type', 'side', 'is_active'];

    public function category()
    {
        return $this->belongsTo(\App\Models\Inventory\Category::class, 'category_id');
    }

    public function services()
    {
        return $this->belongsToMany(\App\Models\Workshop\Service::class, 'service_parts_mapping', 'part_id', 'service_id');
    }
}



