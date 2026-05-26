<?php

namespace App\Models\Workshop;

use App\Models\CRM\Customer;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'customer_id',
        'service_rating',
        'technical_rating',
        'comment'
    ];

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
