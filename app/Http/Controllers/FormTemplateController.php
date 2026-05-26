<?php

namespace App\Http\Controllers;

use App\Models\System\FormDocumentType;
use App\Models\System\FormTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FormTemplateController extends Controller
{
    /**
     * Get templates. If slug is provided, get for that type. Otherwise get all.
     */
    public function index(?string $slug = null): JsonResponse
    {
        try {
            $query = FormTemplate::query()
                ->select(['id', 'form_document_type_id', 'name', 'is_system', 'is_active_for_print', 'page_size', 'created_at', 'updated_at'])
                ->with('documentType:id,name,slug')
                ->orderBy('name');

            if ($slug) {
                $docType = FormDocumentType::where('slug', $slug)->first();
                if (!$docType) {
                    return response()->json(['message' => 'Document type not found'], 404);
                }
                $templates = $query->where('form_document_type_id', $docType->id)->get();
            } else {
                $templates = $query->get();
            }

            return response()->json($templates);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error loading templates: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Get the active template for a given document type slug.
     */
    public function getActiveTemplate(string $slug): JsonResponse
    {
        $docType = FormDocumentType::where('slug', $slug)->first();

        if (!$docType) {
            return response()->json(['message' => 'Document type not found'], 404);
        }

        $template = $docType->templates()
            ->where('is_active_for_print', true)
            ->first();

        if (!$template) {
            // Fallback to the first template if none is marked active
            $template = $docType->templates()->first();
        }

        if (!$template) {
            return response()->json(['message' => 'No templates found for this document type'], 404);
        }

        $template->styles = array_merge($template->styles ?? [], [
            'globalBranding' => $this->getSystemBranding()
        ]);

        return response()->json($template);
    }

    /**
     * Get a specific template by ID.
     */
    public function show(int $id): JsonResponse
    {
        $template = FormTemplate::findOrFail($id);
        
        $template->styles = array_merge($template->styles ?? [], [
            'globalBranding' => $this->getSystemBranding()
        ]);

        return response()->json($template);
    }

    /**
     * Clone a system template to a custom template.
     */
    public function clone(int $id): JsonResponse
    {
        $template = FormTemplate::findOrFail($id);

        // Duplicate the row
        $newTemplate = $template->replicate();
        $newTemplate->name = $template->name . ' (Custom)';
        $newTemplate->is_system = false;
        $newTemplate->is_active_for_print = false;
        $newTemplate->save();

        return response()->json([
            'message' => 'Template cloned successfully',
            'id' => $newTemplate->id,
            'template' => $newTemplate
        ], 201);
    }

    /**
     * Update styles and layout_config for a custom template.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $template = FormTemplate::findOrFail($id);

        if ($template->is_system) {
            return response()->json([
                'message' => 'System templates cannot be modified directly. Please clone to customize.'
            ], 403);
        }

        $request->validate([
            'styles' => 'sometimes|required|array',
            'layout_config' => 'sometimes|required|array',
            'name' => 'sometimes|required|string|max:255',
        ]);

        $template->update($request->only(['styles', 'layout_config', 'name']));

        return response()->json([
            'message' => 'Template updated successfully',
            'template' => $template
        ]);
    }

    /**
     * Set a template as active for printing.
     */
    public function activate(int $id): JsonResponse
    {
        $template = FormTemplate::findOrFail($id);

        try {
            DB::transaction(function () use ($template) {
                // Deactivate all templates of the same document type
                FormTemplate::where('form_document_type_id', $template->form_document_type_id)
                    ->update(['is_active_for_print' => false]);

                // Activate current template
                $template->update(['is_active_for_print' => true]);
            });

            return response()->json([
                'message' => 'Template activated successfully',
                'id' => $template->id
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to activate template'], 500);
        }
    }

    /**
     * Store a new template.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'form_document_type_id' => 'required|exists:form_document_types,id',
            'page_size' => 'required|string|in:A4,A5,Letter',
        ]);

        $docType = FormDocumentType::findOrFail($request->form_document_type_id);

        $template = FormTemplate::create([
            'name' => $request->name,
            'form_document_type_id' => $request->form_document_type_id,
            'page_size' => $request->page_size,
            'is_system' => false,
            'is_active_for_print' => false,
            'styles' => \App\Utils\TemplateDefaultHelper::getDefaultStyles(),
            'layout_config' => \App\Utils\TemplateDefaultHelper::getDefaultLayoutConfig($docType->slug),
        ]);

        return response()->json($template, 201);
    }

    /**
     * Delete a template.
     */
    public function destroy(int $id): JsonResponse
    {
        $template = FormTemplate::findOrFail($id);
        
        if ($template->is_system) {
            return response()->json(['message' => 'System templates cannot be deleted'], 403);
        }

        $template->delete();

        return response()->json(null, 204);
    }

    /**
     * Get global system branding settings.
     */
    private function getSystemBranding()
    {
        $branding = [];
        $keys = ['company_name', 'company_name_km', 'company_address', 'company_phone', 'company_email', 'company_website', 'company_tin', 'company_logo'];
        foreach ($keys as $key) {
            $branding[$key] = \App\Models\System\SystemSetting::get($key);
        }

        return $branding;
    }

    /**
     * Reset a custom template to its original system default.
     */
    public function reset($id): JsonResponse
    {
        $template = FormTemplate::findOrFail($id);

        if ($template->is_system) {
            return response()->json([
                'message' => 'System templates cannot be reset as they are already the original version.'
            ], 403);
        }

        // Find the system template for the same document type
        $systemTemplate = FormTemplate::where('form_document_type_id', $template->form_document_type_id)
            ->where('is_system', true)
            ->first();

        if (!$systemTemplate) {
            return response()->json([
                'message' => 'Original system template not found for this document type.'
            ], 404);
        }

        // Reset the template design but keep its name and ID
        $template->update([
            'styles' => $systemTemplate->styles,
            'layout_config' => $systemTemplate->layout_config,
            'page_size' => $systemTemplate->page_size,
        ]);

        return response()->json([
            'message' => 'Template design reset to original state successfully.',
            'template' => $template->fresh()
        ]);
    }
}
