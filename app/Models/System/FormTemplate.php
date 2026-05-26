<?php

namespace App\Models\System;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\LogsSystemActivity;

class FormTemplate extends Model
{
    use HasUlids, BelongsToCompany;

    protected $fillable = [
        'form_document_type_id',
        'name',
        'is_system',
        'is_active_for_print',
        'page_size',
        'styles',
        'layout_config',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_system' => 'boolean',
        'is_active_for_print' => 'boolean',
        'styles' => 'array',
        'layout_config' => 'array',
    ];

    /**
     * Get the document type that the template belongs to.
     */
    public function documentType(): BelongsTo
    {
        return $this->belongsTo(FormDocumentType::class, 'form_document_type_id');
    }
}


