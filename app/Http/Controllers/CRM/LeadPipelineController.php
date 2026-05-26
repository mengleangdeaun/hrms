<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\LeadPipeline;
use App\Models\CRM\LeadPipelineStage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadPipelineController extends Controller
{
    public function index()
    {
        return LeadPipeline::with('stages')->get();
    }

    public function show(LeadPipeline $pipeline)
    {
        return $pipeline->load('stages');
    }

    /**
     * Update/Reorder stages for a pipeline.
     */
    public function updateStages(Request $request, LeadPipeline $pipeline)
    {
        $validated = $request->validate([
            'stages' => 'required|array',
            'stages.*.id' => 'nullable|exists:crm_lead_pipeline_stages,id',
            'stages.*.name' => 'required|string|max:255',
            'stages.*.color' => 'nullable|string|max:20',
            'stages.*.sort_order' => 'required|integer',
        ]);

        return DB::transaction(function () use ($validated, $pipeline) {
            $incomingIds = collect($validated['stages'])->pluck('id')->filter()->toArray();
            
            // 1. Delete stages not in the list (if they don't have leads)
            $pipeline->stages()->whereNotIn('id', $incomingIds)->each(function($stage) {
                if ($stage->leads()->exists()) {
                    throw new \Exception("Cannot delete stage '{$stage->name}' because it contains leads.");
                }
                $stage->delete();
            });

            // 2. Update or Create stages
            foreach ($validated['stages'] as $stageData) {
                $pipeline->stages()->updateOrCreate(
                    ['id' => $stageData['id'] ?? null],
                    [
                        'name' => $stageData['name'],
                        'color' => $stageData['color'] ?? '#94a3b8',
                        'sort_order' => $stageData['sort_order'],
                    ]
                );
            }

            return $pipeline->load('stages');
        });
    }
}
