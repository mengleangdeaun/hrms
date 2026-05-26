<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class AwardType extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'status',
        'description',
    ];
}
