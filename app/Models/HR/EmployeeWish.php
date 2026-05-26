<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeWish extends Model
{
    use HasUlids, BelongsToCompany, HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'type',
        'message',
        'image_path',
        'year',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
        'year' => 'integer',
    ];

    public function sender()
    {
        return $this->belongsTo(Employee::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(Employee::class, 'receiver_id');
    }
}
