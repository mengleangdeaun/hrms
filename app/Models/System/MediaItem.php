<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class MediaItem extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'name',
        'type',
        'size',
        'is_favorite',
        'extension',
        'path',
        'parent_id',
    ];

    /**
     * Get the subfolders/files for a folder.
     */
    public function children()
    {
        return $this->hasMany(MediaItem::class, 'parent_id');
    }

    /**
     * Get the parent folder.
     */
    public function parent()
    {
        return $this->belongsTo(MediaItem::class, 'parent_id');
    }
}


