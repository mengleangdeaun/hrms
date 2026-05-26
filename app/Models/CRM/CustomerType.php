<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\CRM\Customer;
use App\Traits\LogsSystemActivity;

class CustomerType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }
}

