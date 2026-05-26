<?php

namespace App\Models\Workshop;

use App\Models\Inventory\Product;
use App\Models\HR\Branch;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\LogsSystemActivity;

class OffCutSerial extends Model
{
    use HasFactory;

    protected $table = 'inventory_off_cut_serials';

    protected $fillable = [
        'product_id',
        'serial_number',
        'quantity',
        'width',
        'height',
        'branch_id',
        'job_card_id',
        'status',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'width' => 'decimal:4',
        'height' => 'decimal:4',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class);
    }

    public function jobCard()
    {
        return $this->belongsTo(\App\Models\Workshop\JobCard::class);
    }
}



