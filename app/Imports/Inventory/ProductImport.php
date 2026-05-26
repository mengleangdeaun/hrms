<?php

namespace App\Imports\Inventory;

use App\Models\Inventory\Product;
use App\Models\Inventory\Category;
use App\Models\Inventory\Uom;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Str;

class ProductImport implements ToModel, WithHeadingRow, WithValidation, SkipsEmptyRows
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        $category = null;
        if (!empty($row['category'])) {
            $categoryName = trim($row['category']);
            $category = Category::where('name', $categoryName)->first();
            if (!$category) {
                $category = Category::create([
                    'name' => $categoryName,
                    'code' => Str::upper(Str::slug($categoryName)),
                    'is_active' => true
                ]);
            }
        }

        $baseUom = null;
        if (!empty($row['base_uom'])) {
            $uomName = trim($row['base_uom']);
            $baseUom = Uom::where('name', $uomName)->orWhere('code', $uomName)->first();
            if (!$baseUom) {
                $baseUom = Uom::create([
                    'name' => $uomName,
                    'code' => Str::upper(Str::slug($uomName)),
                    'is_active' => true
                ]);
            }
        }

        $purchaseUom = null;
        if (!empty($row['purchase_uom'])) {
            $uomName = trim($row['purchase_uom']);
            $purchaseUom = Uom::where('name', $uomName)->orWhere('code', $uomName)->first();
            if (!$purchaseUom) {
                $purchaseUom = Uom::create([
                    'name' => $uomName,
                    'code' => Str::upper(Str::slug($uomName)),
                    'is_active' => true
                ]);
            }
        }

        return new Product([
            'code'              => $row['code'],
            'sku'               => $row['sku'] ?? null,
            'barcode'           => $row['barcode'] ?? null,
            'name'              => $row['name'],
            'brand'             => $row['brand'] ?? null,
            'category_id'       => $category?->id,
            'base_uom_id'       => $baseUom?->id,
            'purchase_uom_id'   => $purchaseUom?->id ?? $baseUom?->id,
            'uom_multiplier'    => $row['uom_multiplier'] ?? 1,
            'cost'              => $row['cost'] ?? 0,
            'price'             => $row['price'] ?? 0,
            'reorder_level'     => $row['reorder_level'] ?? 0,
            'short_description' => $row['short_description'] ?? null,
            'description'       => $row['description'] ?? null,
            'is_active'         => $this->parseBoolean($row['is_active'] ?? 'yes'),
            'show_in_tma'       => $this->parseBoolean($row['show_in_tma'] ?? 'no'),
            'warranty_duration' => $row['warranty_duration'] ?? null,
            'warranty_unit'     => $row['warranty_unit'] ?? null,
            'lifespan_duration' => $row['lifespan_duration'] ?? null,
            'lifespan_unit'     => $row['lifespan_unit'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'code' => 'required|unique:inventory_products,code',
            'name' => 'required|string',
            'category' => 'nullable|string',
            'base_uom' => 'nullable|string',
        ];
    }

    private function parseBoolean($value)
    {
        if (is_bool($value)) return $value;
        if (is_numeric($value)) return (bool)$value;
        
        $value = strtolower(trim($value));
        return in_array($value, ['yes', '1', 'true', 'active']);
    }
}
