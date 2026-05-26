<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadPipeline extends Model
{
    use HasFactory;

    protected $table = 'crm_lead_pipelines';

    protected $fillable = [
        'name',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function stages()
    {
        return $this->hasMany(LeadPipelineStage::class, 'pipeline_id')->orderBy('sort_order');
    }
}
