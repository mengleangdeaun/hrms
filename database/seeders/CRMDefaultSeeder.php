<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CRM\ContactCategory;
use App\Models\CRM\LeadPipeline;
use App\Models\CRM\LeadPipelineStage;

class CRMDefaultSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Contact Categories
        $categories = [
            ['name' => 'Client', 'slug' => 'client', 'color' => '#10b981', 'is_system' => true],
            ['name' => 'Supplier', 'slug' => 'supplier', 'color' => '#f59e0b', 'is_system' => true],
            ['name' => 'Partner', 'slug' => 'partner', 'color' => '#6366f1', 'is_system' => true],
            ['name' => 'Lead', 'slug' => 'lead', 'color' => '#94a3b8', 'is_system' => true],
        ];

        foreach ($categories as $category) {
            ContactCategory::updateOrCreate(['slug' => $category['slug']], $category);
        }

        // 2. Default Lead Pipeline
        $pipeline = LeadPipeline::updateOrCreate(
            ['name' => 'Main Sales Pipeline'],
            ['is_default' => true, 'is_active' => true]
        );

        // 3. Pipeline Stages
        $stages = [
            ['name' => 'New', 'color' => '#94a3b8', 'sort_order' => 1],
            ['name' => 'Contacted', 'color' => '#38bdf8', 'sort_order' => 2],
            ['name' => 'Qualified', 'color' => '#818cf8', 'sort_order' => 3],
            ['name' => 'Quoted', 'color' => '#22d3ee', 'sort_order' => 4],
            ['name' => 'Negotiating', 'color' => '#fbbf24', 'sort_order' => 5],
            ['name' => 'On Hold', 'color' => '#71717a', 'sort_order' => 6],
            ['name' => 'Pending', 'color' => '#a78bfa', 'sort_order' => 7],
            ['name' => 'Won', 'color' => '#10b981', 'sort_order' => 8],
            ['name' => 'Lost', 'color' => '#f43f5e', 'sort_order' => 9],
        ];

        foreach ($stages as $stage) {
            LeadPipelineStage::updateOrCreate(
                ['pipeline_id' => $pipeline->id, 'name' => $stage['name']],
                $stage
            );
        }
    }
}
