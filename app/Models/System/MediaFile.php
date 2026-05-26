<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Traits\LogsSystemActivity;

class MediaFile extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'name', 'extension', 'file_type', 'size_bytes', 'size_human', 
        'mime_type', 'url', 'path', 'disk', 'is_favorite', 'folder_id'
    ];

    protected $appends = ['url'];

    public function folder()
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }
    public function getUrlAttribute($value)
    {
        // If it's already a full URL (e.g. S3/external), return it
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        if ($this->path) {
            try {
                // If path is absolute URL (unlikely for path, but for safety)
                if (filter_var($this->path, FILTER_VALIDATE_URL)) {
                    return $this->path;
                }
                
                return \Illuminate\Support\Facades\Storage::url($this->path);
            } catch (\Exception $e) {
                return $value;
            }
        }
        return $value;
    }

    protected static function booted()
    {
        static::deleting(function ($mediaFile) {
            if ($mediaFile->path && $mediaFile->disk) {
                try {
                    \Illuminate\Support\Facades\Storage::disk($mediaFile->disk)->delete($mediaFile->path);
                } catch (\Exception $e) {
                    // Ignore deletion errors if disk is not-configured
                }
            } elseif ($mediaFile->url) {
                // Fallback for legacy files before this update
                try {
                    $path = str_replace('/storage/', '', $mediaFile->url);
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
                } catch (\Exception $e) {
                    // Ignore
                }
            }
        });
    }
}


