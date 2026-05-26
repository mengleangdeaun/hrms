<?php

namespace App\Models\Workshop;

use App\Models\Inventory\Product;
use App\Models\Inventory\ProductSerial;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class JobCardMaterialUsage extends Model
{
    use HasFactory;

    protected $table = 'job_card_material_usage';

    protected $fillable = [
        'job_card_id',
        'job_card_item_id',
        'product_id',
        'serial_id',
        'spent_qty',
        'actual_qty',
        'unit',
        'width_on_car',
        'height_on_car',
        'width_cut',
        'height_cut',
        'is_damage',
        'is_off_cut'
    ];

    protected $casts = [
        'spent_qty' => 'decimal:4',
        'actual_qty' => 'decimal:4',
        'width_on_car' => 'decimal:2',
        'height_on_car' => 'decimal:2',
        'width_cut' => 'decimal:2',
        'height_cut' => 'decimal:2',
        'is_damage' => 'boolean',
        'is_off_cut' => 'boolean',
    ];

    public function jobCard()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCard::class);
    }

    public function jobCardItem()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCardItem::class, 'job_card_item_id');
    }

    public function product()
    {
        return $this->belongsTo(\App\Models\Inventory\Product::class, 'product_id');
    }

    public function serial()
    {
        return $this->belongsTo(\App\Models\Inventory\ProductSerial::class, 'serial_id');
    }
}




