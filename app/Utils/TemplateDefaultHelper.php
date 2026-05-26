<?php

namespace App\Utils;

class TemplateDefaultHelper
{
    public static function getDefaultStyles(): array
    {
        return [
            // 1. General
            'general' => [
                'template_name' => '',
                'paper_size' => 'A4',
                'orientation' => 'portrait',
                'margins' => [
                    'top' => 30,
                    'bottom' => 30,
                    'left' => 30,
                    'right' => 30,
                ],
                'watermark' => [
                    'show' => false,
                    'type' => 'text',
                    'text' => 'S-COOL',
                    'image' => null,
                    'size' => 300,
                    'opacity' => 0.05,
                    'rotate' => -45,
                ],
                'font_family' => 'Arial, sans-serif',
                'font_size' => 12,
                'primary_color' => 'hsl(356, 100%, 39%)',
            ],
            'brandingOverrides' => [
                'source' => 'system', // options: system, branch, custom
                'enabled' => false,
                'company_name' => null,
                'company_address' => null,
                'company_phone' => null,
                'company_email' => null,
                'company_website' => null,
                'company_tin' => null,
                'company_logo' => null,
            ],
            // 2. Header
            'header' => [
                'show' => true,
                'logo' => [
                    'show' => true,
                    'url' => null,
                    'width' => 130,
                    'position' => 'left',
                ],
                'alignment' => 'left',
                'layout_type' => 'columns',
                'columns' => 2,
                'width' => 100,
                'all_pages' => true,
                'border_bottom' => true,
                'border_color' => 'hsl(356, 100%, 39%)',
                'border_width' => 2,
                'border_offset' => 0,
                'padding' => [
                    'top' => 10,
                    'left' => 0,
                    'right' => 0,
                ],
                'line_height' => 1.3,
                'fields' => [
                    'local_company_name' => true,
                    'company_name' => true,
                    'vat_tin_number' => false,
                    'address' => true,
                    'phone' => true,
                    'email' => true,
                    'website' => true,
                ],
            ],
            // 3. Document Info (Groups)
            'doc_info' => [
                'show_title' => true,
                'show_title_km' => true,
                'title_content' => null,
                'title_position' => 'top',
                'width_left' => 50,
                'width_right' => 50,
                'margin_top' => 20,
                'label' => ['font' => 'Arial, sans-serif', 'size' => 11, 'color' => '#64748b', 'align' => 'left', 'lang' => 'all'],
                'info' => ['font' => 'Arial, sans-serif', 'size' => 11, 'color' => '#1e293b', 'align' => 'left', 'separator' => ':', 'indent_left' => 130, 'indent_right' => 130],
                'left_columns' => [
                    ['id' => 'customer_name', 'label' => 'Customer Name', 'label_km' => 'ឈ្មោះអតិថិជន', 'label_en' => 'Customer Name', 'visible' => true],
                    ['id' => 'customer_address', 'label' => 'Address', 'label_km' => 'អាសយដ្ឋាន', 'label_en' => 'Address', 'visible' => true],
                    ['id' => 'customer_phone', 'label' => 'Phone', 'label_km' => 'លេខទូរស័ព្ទ', 'label_en' => 'Phone', 'visible' => true],
                    ['id' => 'vat_tin', 'label' => 'VAT TIN', 'label_km' => 'លេខអត្តសញ្ញាណកម្មសារពើពន្ធ', 'label_en' => 'VAT TIN', 'visible' => true],
                    ['id' => 'vehicle_reg', 'label' => 'Plate Number', 'label_km' => 'ស្លាកលេខ', 'label_en' => 'Plate Number', 'visible' => false],
                    ['id' => 'vehicle_brand', 'label' => 'Brand', 'label_km' => 'ម៉ាក', 'label_en' => 'Brand', 'visible' => false],
                    ['id' => 'vehicle_model', 'label' => 'Model', 'label_km' => 'ម៉ូដែល', 'label_en' => 'Model', 'visible' => false],
                ],
                'right_columns' => [
                    ['id' => 'doc_number', 'label' => 'Number', 'label_km' => 'លេខរៀង', 'label_en' => 'Number', 'visible' => true],
                    ['id' => 'doc_date', 'label' => 'Date', 'label_km' => 'កាលបរិច្ឆេទ', 'label_en' => 'Date', 'visible' => true],
                    ['id' => 'reference', 'label' => 'Reference', 'label_km' => 'យោង', 'label_en' => 'Reference', 'visible' => true],
                    ['id' => 'term_name', 'label' => 'Payment Term', 'label_km' => 'លក្ខខណ្ឌទូទាត់', 'label_en' => 'Payment Term', 'visible' => true],
                    ['id' => 'vehicle_vin_last4', 'label' => 'VIN', 'label_km' => 'លេខតួ', 'label_en' => 'VIN', 'visible' => false],
                    ['id' => 'warranty_certificate_no', 'label' => 'Cert No', 'label_km' => 'លេខវិញ្ញាបនបត្រ', 'label_en' => 'Cert No', 'visible' => false],
                    ['id' => 'installation_date', 'label' => 'Install Date', 'label_km' => 'ថ្ងៃតម្លើង', 'label_en' => 'Install Date', 'visible' => false],
                ],
            ],
            // 4. Table
            'table' => [
                'lang' => 'all',
                'header' => [
                    'bg' => 'hsl(356, 100%, 39%)',
                    'color' => '#ffffff',
                    'size' => 10,
                    'padding' => 10,
                ],
                'body' => [
                    'bg' => '#ffffff',
                    'color' => '#1e293b',
                    'size' => 10,
                    'padding' => 8,
                ],
                'border_color' => '#cbd5e1',
                'border_width' => 1,
                'border_option' => 'all', // all, none, only_row, only_column
                'show_currency' => true,
                'total_rows' => 5,
                'columns' => [
                    ['id' => 'no', 'label' => 'No', 'label_km' => 'ល.រ', 'label_en' => 'No', 'width' => 45, 'align' => 'center', 'visible' => true],
                    ['id' => 'description', 'label' => 'Item Name / Description', 'label_km' => 'ឈ្មោះទំនិញ / បរិយាយ', 'label_en' => 'Item Name / Description', 'align' => 'left', 'visible' => true],
                    ['id' => 'uom', 'label' => 'Unit', 'label_km' => 'ឯកតា', 'label_en' => 'Unit', 'width' => 70, 'align' => 'center', 'visible' => true],
                    ['id' => 'qty', 'label' => 'Qty', 'label_km' => 'ចំនួន', 'label_en' => 'Qty', 'width' => 70, 'align' => 'center', 'visible' => true],
                    ['id' => 'unit_price', 'label' => 'Unit Price', 'label_km' => 'តម្លៃរាយ', 'label_en' => 'Unit Price', 'width' => 110, 'align' => 'right', 'visible' => true],
                    ['id' => 'discount', 'label' => 'Discount', 'label_km' => 'បញ្ចុះតម្លៃ', 'label_en' => 'Discount', 'width' => 90, 'align' => 'right', 'visible' => true],
                    ['id' => 'amount', 'label' => 'Amount', 'label_km' => 'សរុប', 'label_en' => 'Amount', 'width' => 110, 'align' => 'right', 'visible' => true],
                ],
            ],
            // 5. Totals & Footer
            'footer' => [
                'placement' => 'fixed',
                'margin_top' => 40,
                'margin_bottom' => 0,
                'font_family' => 'Arial, sans-serif',
                'font_color' => '#64748b',
                'summary_row' => true,
                'summary_riel' => true,
                'note' => [
                    'show' => true,
                    'font_family' => 'Arial, sans-serif',
                    'content' => '<p><strong>Notes:</strong> Please check your items before leaving. Goods sold are not returnable. Thank you!</p>',
                ],
                'totals' => [
                    ['id' => 'sub_total', 'label' => 'Sub Total', 'visible' => true],
                    ['id' => 'total_discount', 'label' => 'Discount', 'visible' => true],
                    ['id' => 'total_tax', 'label' => 'VAT (10%)', 'visible' => true],
                    ['id' => 'grand_total', 'label' => 'Grand Total', 'visible' => true],
                ],
                'signature' => [
                    'show' => true,
                    'count' => 2,
                    'line_style' => 'solid',
                    'items' => [
                        ['id' => 'sig_1', 'label' => 'Customer Signature', 'show_label' => true, 'image' => null],
                        ['id' => 'sig_2', 'label' => 'Authorized Signature', 'show_label' => true, 'image' => null],
                        ['id' => 'sig_3', 'label' => 'Manager Approval', 'show_label' => true, 'image' => null],
                    ],
                ],
            ],
        ];
    }

    public static function getDefaultLayoutConfig(string $typeSlug): array
    {
        // System sections (Logo, Table, Totals, Signatures) are permanent parts of the document structure.
        // We keep the draggable layout zones empty by default so users can add their OWN custom blocks.
        return [
            'header' => [],
            'body' => [],
            'footer' => [],
        ];
    }
}
