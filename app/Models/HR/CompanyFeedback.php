<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class CompanyFeedback extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $table = 'company_feedback';

    protected $fillable = [
        'type',
        'message',
        'recommendation',
    ];
}
