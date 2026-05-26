<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class DocumentType extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'description',
        'is_required',
        'status',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];
}
