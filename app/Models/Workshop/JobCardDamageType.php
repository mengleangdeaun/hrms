<?php

namespace App\Models\Workshop;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class JobCardDamageType extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $table = 'job_card_damage_types';

    protected $fillable = [
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function jobCards()
    {
        return $this->hasMany(\App\Models\Workshop\JobCard::class, 'damage_type_id');
    }
}
