<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class DocumentType extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, LogsSystemActivity;

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
