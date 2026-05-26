<?php

namespace App\Models\Inventory;

use App\Models\HR\Branch;

use App\Models\Stock\Stock;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    protected $table = 'inventory_products';

    use HasFactory, \App\Traits\LogsSystemActivity;

    protected $fillable = [
        'code', 'sku', 'barcode', 'category_id', 'base_uom_id', 'purchase_uom_id', 
        'uom_multiplier', 'length', 'width', 'brand', 'name', 'short_description', 'img', 'description', 
        'cost', 'price', 'reorder_level', 'is_active', 'show_in_tma', 'sort_order',
        'warranty_duration', 'warranty_unit', 'lifespan_duration', 'lifespan_unit'
    ];

    protected $appends = ['img_url'];

    public function getImgUrlAttribute()
    {
        if (!$this->img) {
            return null;
        }

        if (filter_var($this->img, FILTER_VALIDATE_URL)) {
            return $this->img;
        }

        return Storage::disk('public')->url($this->img);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function baseUom()
    {
        return $this->belongsTo(Uom::class, 'base_uom_id');
    }

    public function purchaseUom()
    {
        return $this->belongsTo(Uom::class, 'purchase_uom_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'inventory_product_tags', 'product_id', 'tag_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'product_id');
    }

    public function serials()
    {
        return $this->hasMany(ProductSerial::class, 'product_id');
    }

    public function branches()
    {
        return $this->belongsToMany(\App\Models\HR\Branch::class, 'branch_inventory_product', 'inventory_product_id', 'branch_id')->withPivot('is_active', 'reorder_level')->withTimestamps();
    }
}

