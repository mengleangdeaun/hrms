<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class MediaFolder extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = ['name', 'color', 'parent_id'];

    public function children()
    {
        return $this->hasMany(MediaFolder::class, 'parent_id');
    }

    public function children_recursive()
    {
        return $this->children()->with('children_recursive');
    }

    public function files()
    {
        return $this->hasMany(MediaFile::class, 'folder_id');
    }
}


