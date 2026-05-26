<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ContactAttachment extends Model
{
    use HasFactory;

    protected $table = 'crm_contact_attachments';

    protected $fillable = [
        'contact_id',
        'file_path',
        'original_name',
        'file_size',
        'mime_type',
    ];

    protected $appends = [
        'file_url',
    ];

    public function getFileUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        if (filter_var($this->file_path, FILTER_VALIDATE_URL)) {
            return $this->file_path;
        }

        return Storage::url($this->file_path);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }
}
