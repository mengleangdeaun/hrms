<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;
use Illuminate\Support\Facades\Storage;

class Award extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, LogsSystemActivity;

    protected $fillable = [
        'employee_id',
        'award_type_id',
        'date',
        'gift',
        'description',
        'certificate',
        'photo',
    ];

    protected $appends = [
        'certificate_url',
        'photo_url',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function awardType()
    {
        return $this->belongsTo(AwardType::class);
    }

    public function getCertificateUrlAttribute(): ?string
    {
        if (!$this->certificate) {
            return null;
        }

        if (filter_var($this->certificate, FILTER_VALIDATE_URL)) {
            return $this->certificate;
        }

        // Strip legacy prefixes (/storage/ or storage/)
        $cleanPath = ltrim($this->certificate, '/');
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        // If it's a PDF, use the proxy route to force 'inline' headers and prevent unwanted downloads
        $ext = strtolower(pathinfo($cleanPath, PATHINFO_EXTENSION));
        if ($ext === 'pdf') {
            return '/media/preview?path=' . urlencode($cleanPath);
        }

        // Return a root-relative URL to ensure correct browser behavior (previewing instead of downloading)
        // and to avoid APP_URL mismatch issues (e.g., localhost vs 127.0.0.1) that cause 401 failures.
        return '/storage/' . ltrim($cleanPath, '/');
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) {
            return null;
        }

        if (filter_var($this->photo, FILTER_VALIDATE_URL)) {
            return $this->photo;
        }

        // Strip legacy prefixes (/storage/ or storage/)
        $cleanPath = ltrim($this->photo, '/');
        if (str_starts_with($cleanPath, 'storage/')) {
            $cleanPath = substr($cleanPath, 8);
        }

        return '/storage/' . ltrim($cleanPath, '/');
    }
}
