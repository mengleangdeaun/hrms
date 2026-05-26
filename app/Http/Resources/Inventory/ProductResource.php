<?php

namespace App\Http\Resources\Inventory;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'brand' => $this->brand,
            'price' => $this->price,
            'cost' => $this->cost,
            'reorder_level' => $this->reorder_level,
            'category_id' => $this->category_id,
            'base_uom_id' => $this->base_uom_id,
            'purchase_uom_id' => $this->purchase_uom_id,
            'uom_multiplier' => $this->uom_multiplier,
            'length' => $this->length,
            'width' => $this->width,
            'is_active' => $this->is_active,
            'show_in_tma' => $this->show_in_tma,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'warranty_duration' => $this->warranty_duration,
            'warranty_unit' => $this->warranty_unit,
            'lifespan_duration' => $this->lifespan_duration,
            'lifespan_unit' => $this->lifespan_unit,
            'branch_stock_qty' => $this->branch_stock_qty,
            'img' => $this->img,
            'img_url' => $this->img_url,
            
            // Minimalist Relations
            'category' => $this->whenLoaded('category', function() {
                return [
                    'id' => $this->category->id,
                    'code' => $this->category->code,
                    'name' => $this->category->name,
                ];
            }),
            'base_uom' => $this->whenLoaded('baseUom', function() {
                return [
                    'id' => $this->baseUom->id,
                    'code' => $this->baseUom->code,
                    'name' => $this->baseUom->name,
                ];
            }),
            'purchase_uom' => $this->whenLoaded('purchaseUom', function() {
                return [
                    'id' => $this->purchaseUom->id,
                    'code' => $this->purchaseUom->code,
                    'name' => $this->purchaseUom->name,
                ];
            }),
            'tags' => $this->whenLoaded('tags', function() {
                return $this->tags->map(fn($tag) => [
                    'id' => $tag->id,
                    'name' => $tag->name,
                    'color' => $tag->color,
                ]);
            }),
            // Only include stocks if explicitly loaded (usually for detail view)
            'stocks' => $this->whenLoaded('stocks', function() {
                return $this->stocks->map(fn($stock) => [
                    'id' => $stock->id,
                    'location_id' => $stock->location_id,
                    'quantity' => $stock->quantity,
                    'location' => [
                        'id' => $stock->location->id,
                        'name' => $stock->location->name,
                    ],
                ]);
            }),
        ];
    }
}
