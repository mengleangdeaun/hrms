<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Category extends Model
{
    protected $table = 'inventory_categories';

    use HasFactory, LogsSystemActivity;

    protected $fillable = ['parent_id', 'code', 'name', 'description', 'is_active'];

    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}

