<?php

namespace Database\Seeders;

use App\Models\System\FormDocumentType;
use App\Models\System\FormTemplate;
use App\Utils\TemplateDefaultHelper;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DocumentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $mapping = [
            'invoice' => 'sale_invoice',
            'tax-invoice' => 'tax_invoice',
            'purchase-order' => 'purchase_order',
            'purchase-receive' => 'purchase_receive',
            'stock-adjustment' => 'stock_adjustment',
            'stock-transfer' => 'stock_transfer',
            'sale_order' => null // Mark for deletion
        ];

        foreach ($mapping as $oldSlug => $newSlug) {
            $oldType = FormDocumentType::where('slug', $oldSlug)->first();
            if ($oldType) {
                if ($newSlug) {
                    $newType = FormDocumentType::firstOrCreate(
                        ['slug' => $newSlug],
                        ['name' => $oldType->name, 'is_active' => true]
                    );
                    
                    // Move templates from old to new
                    FormTemplate::where('form_document_type_id', $oldType->id)
                        ->update(['form_document_type_id' => $newType->id]);
                } else {
                    // Just delete templates if no mapping
                    FormTemplate::where('form_document_type_id', $oldType->id)->delete();
                }
                
                // Delete the old type
                $oldType->delete();
            }
        }

        // Force delete ALL existing system templates to prevent duplicates
        FormTemplate::where('is_system', true)->delete();

        $types = [
            ['name' => 'Quotation', 'slug' => 'quotation'],
            ['name' => 'Invoice', 'slug' => 'sale_invoice'],
            ['name' => 'Tax Invoice', 'slug' => 'tax_invoice'],
            ['name' => 'Job Warranty Card', 'slug' => 'job_warranty_card'],
            ['name' => 'Purchase Order', 'slug' => 'purchase_order'],
            ['name' => 'Purchase Receive', 'slug' => 'purchase_receive'],
            ['name' => 'Stock Adjustment', 'slug' => 'stock_adjustment'],
            ['name' => 'Stock Transfer', 'slug' => 'stock_transfer'],
        ];

        foreach ($types as $typeData) {
            $type = FormDocumentType::updateOrCreate(
                ['slug' => $typeData['slug']],
                ['name' => $typeData['name'], 'is_active' => true]
            );

            // Deactivate all other templates for this type before creating/updating the system one
            FormTemplate::where('form_document_type_id', $type->id)
                ->where('is_system', false)
                ->update(['is_active_for_print' => false]);

            // Update or create a default system template for each type
            FormTemplate::updateOrCreate(
                [
                    'form_document_type_id' => $type->id,
                    'is_system' => true,
                ],
                [
                    'name' => 'Standard ' . $typeData['name'],
                    'is_active_for_print' => true,
                    'page_size' => 'A4',
                    'styles' => TemplateDefaultHelper::getDefaultStyles(),
                    'layout_config' => TemplateDefaultHelper::getDefaultLayoutConfig($type->slug),
                ]
            );
        }
    }
}
