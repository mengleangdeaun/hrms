<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\System\DocumentSetting;
use Illuminate\Http\Request;

class DocumentSettingController extends Controller
{
    /**
     * Get all document numbering settings.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $branchId = $request->branch_id;

        // Define standard types we want to ensure exist
        $types = [
            'purchase_order' => 'Purchase Order',
            'purchase_receive' => 'Purchase Receive',
            'stock_adjustment' => 'Stock Adjustment',
            'stock_transfer' => 'Stock Transfer',
            'sales_order' => 'Sales Order',
            'sales_invoice' => 'Sales Invoice',
            'tax_invoice' => 'Tax Invoice',
            'quotation' => 'Quotation',
            'job_card' => 'Job Card',
            'job_warranty_card' => 'Warranty Card',
            'replacement' => 'Replacement',
            'lead' => 'Lead',
            'service_booking' => 'Service Booking',
            'customer' => 'Customer',
            'customer_code' => 'Customer Code',
        ];

        foreach ($types as $type => $label) {
            $exists = DocumentSetting::where('document_type', $type)
                ->where(function($q) use ($branchId) {
                    if ($branchId) $q->where('branch_id', $branchId);
                    else $q->whereNull('branch_id');
                })->exists();

            if (!$exists) {
                if ($branchId) {
                    // Try to copy from global
                    $global = DocumentSetting::where('document_type', $type)->whereNull('branch_id')->first();
                    DocumentSetting::create([
                        'document_type' => $type,
                        'branch_id' => $branchId,
                        'prefix' => $global ? $global->prefix : $this->getDefaultPrefix($type),
                        'suffix' => $global ? $global->suffix : null,
                        'separator' => $global ? $global->separator : '-',
                        'number_padding' => $global ? $global->number_padding : (($type === 'customer_code') ? 1 : 4),
                        'next_number' => 1,
                        'date_format' => $global ? $global->date_format : 'YYYYMMDD',
                        'is_yearly_reset' => $global ? $global->is_yearly_reset : false,
                        'is_monthly_reset' => $global ? $global->is_monthly_reset : false,
                        'include_branch_code' => $global ? $global->include_branch_code : true,
                    ]);
                } else {
                    DocumentSetting::create([
                        'document_type' => $type,
                        'branch_id' => null,
                        'prefix' => $this->getDefaultPrefix($type),
                        'number_padding' => ($type === 'customer_code') ? 1 : 4,
                        'next_number' => 1,
                        'include_branch_code' => true,
                    ]);
                }
            }
        }

        $query = DocumentSetting::orderBy('document_type');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        } else {
            $query->whereNull('branch_id');
        }

        $settings = $query->get()->map(function($setting) use ($types) {
            $setting->label = $types[$setting->document_type] ?? ucfirst(str_replace('_', ' ', $setting->document_type));
            return $setting;
        });

        return response()->json($settings->values());
    }

    /**
     * Update a document naming setting.
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        $setting = DocumentSetting::findOrFail($id);
        
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:20',
            'suffix' => 'nullable|string|max:20',
            'separator' => 'nullable|string|max:5',
            'date_format' => 'nullable|string|max:20',
            'number_padding' => 'required|integer|min:0|max:10',
            'next_number' => 'required|integer|min:1',
            'is_yearly_reset' => 'required|boolean',
            'is_monthly_reset' => 'required|boolean',
            'include_branch_code' => 'sometimes|boolean',
        ]);

        $setting->update($validated);

        return response()->json($setting);
    }

    /**
     * Helper to get default prefixes.
     */
    private function getDefaultPrefix(string $type): string
    {
        $map = [
            'purchase_order' => 'PO',
            'purchase_receive' => 'PR',
            'stock_adjustment' => 'ADJ',
            'stock_transfer' => 'TRF',
            'sales_invoice' => 'INV',
            'tax_invoice' => 'TIN',
            'quotation' => 'QT',
            'sales_order' => 'SO',
            'job_card' => 'JC',
            'job_warranty_card' => 'WTY',
            'replacement' => 'REP',
            'lead' => 'LD',
            'service_booking' => 'BK',
            'customer' => 'CUS',
            'customer_code' => '',
        ];

        return $map[$type] ?? (str_ends_with($type, '_code') ? '' : strtoupper(substr($type, 0, 3)) . '-');
    }

}
