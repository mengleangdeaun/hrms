<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;
use Illuminate\Support\Facades\Storage;

class EmployeeDocument extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'employee_id',
        'document_type_id',
        'file_path',
        'original_name',
    ];

    protected $appends = [
        'media_url',
    ];

    public function getMediaUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        if (filter_var($this->file_path, FILTER_VALIDATE_URL)) {
            return $this->file_path;
        }

        return Storage::url($this->file_path);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }
}
