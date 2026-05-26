<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\LogsSystemActivity;

class FormDocumentType extends Model
{
    use HasUlids, BelongsToCompany;

    protected $fillable = ['name', 'slug', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the templates for the document type.
     */
    public function templates(): HasMany
    {
        return $this->hasMany(FormTemplate::class);
    }
}


