<?php

namespace App\Models\HR;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class Designation extends Model
{
    use HasUlids, BelongsToCompany, HasFactory, LogsSystemActivity;

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function departments()
    {
        return $this->belongsToMany(Department::class);
    }

    public function previousPromotions()
    {
        return $this->hasMany(Promotion::class, 'previous_designation_id');
    }

    public function newPromotions()
    {
        return $this->hasMany(Promotion::class, 'new_designation_id');
    }
}
