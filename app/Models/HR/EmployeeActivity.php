<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;
use App\Traits\LogsSystemActivity;
use Illuminate\Support\Facades\Storage;


class EmployeeActivity extends Model
{
    protected $table = 'employee_activities';

    protected $fillable = [
        'employee_id',
        'activity_type',
        'photo_path',
        'attachments',
        'comment',
        'latitude',
        'longitude',
        'location_name',
        'activity_date',
        'submitted_at',
        'status',
        'admin_note',
    ];

    protected $appends = ['photo_url', 'attachment_urls'];

    protected $casts = [
        'latitude'      => 'float',
        'longitude'     => 'float',
        'activity_date' => 'date',
        'submitted_at'  => 'datetime',
        'attachments'   => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getPhotoUrlAttribute(): ?string
    {
        $path = $this->photo_path;
        if (!$path && !empty($this->attachments) && is_array($this->attachments)) {
            $path = $this->attachments[0];
        }

        if (!$path) return null;

        // If it's already an absolute URL, return it
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        // Strip legacy prefixes (/storage/ or storage/) before resolving via Storage::url
        $cleanPath = ltrim($path, '/');
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        return Storage::url($cleanPath);
    }

    public function getAttachmentUrlsAttribute(): array
    {
        $paths = is_array($this->attachments) ? $this->attachments : [];
        if (empty($paths) && $this->photo_path) {
            $paths = [$this->photo_path];
        }

        return array_map(function ($path) {
            if (filter_var($path, FILTER_VALIDATE_URL)) {
                return $path;
            }

            $cleanPath = ltrim($path, '/');
            if (str_starts_with($cleanPath, 'storage/')) {
                $cleanPath = substr($cleanPath, 8);
            }

            return Storage::url($cleanPath);
        }, $paths);
    }
}
