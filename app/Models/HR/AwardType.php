<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class AwardType extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'status',
        'description',
    ];
}
