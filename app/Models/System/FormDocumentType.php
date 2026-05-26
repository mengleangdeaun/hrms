<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\LogsSystemActivity;

class FormDocumentType extends Model
{
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


