<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeadPipelineStage extends Model
{
    use HasFactory;

    protected $table = 'crm_lead_pipeline_stages';

    protected $fillable = [
        'pipeline_id',
        'name',
        'sort_order',
        'color',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function pipeline()
    {
        return $this->belongsTo(LeadPipeline::class, 'pipeline_id');
    }

    public function leads()
    {
        return $this->hasMany(Lead::class, 'stage_id');
    }
}
