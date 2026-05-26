<?php

namespace App\Models\Workshop;

use App\Models\Inventory\Category;
use App\Models\HR\Branch;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\LogsSystemActivity;

class Service extends Model
{
    use HasFactory, SoftDeletes, LogsSystemActivity;

    protected $fillable = [
        'name',
        'code',
        'base_price',
        'description',
        'category_id',
        'is_active'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function materials()
    {
        return $this->hasMany(ServiceMaterial::class);
    }

    public function parts()
    {
        return $this->belongsToMany(\App\Models\Workshop\JobPartMaster::class, 'service_parts_mapping', 'service_id', 'part_id');
    }

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_service', 'service_id', 'branch_id')->withPivot('is_active')->withTimestamps();
    }

    public function tags()
    {
        return $this->belongsToMany(\App\Models\Inventory\Tag::class, 'service_tags', 'service_id', 'tag_id');
    }
}




