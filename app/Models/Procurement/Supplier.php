<?php

namespace App\Models\Procurement;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Traits\LogsSystemActivity;

class Supplier extends Model
{
    protected $table = 'inventory_suppliers';

    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name', 'contact_person', 'phone', 'email', 'address', 'note', 'attachment_file', 'is_active'
    ];

    protected $appends = ['attachment_file_url'];

    public function getAttachmentFileUrlAttribute()
    {
        if ($this->attachment_file) {
            return Storage::disk('public')->url($this->attachment_file);
        }
        return null;
    }
}


