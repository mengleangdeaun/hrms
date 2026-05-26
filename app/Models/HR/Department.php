<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Department extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function branches()
    {
        return $this->belongsToMany(Branch::class);
    }
}
