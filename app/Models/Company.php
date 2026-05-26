<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use App\Models\HR\Branch;
use App\Models\HR\Employee;
use App\Models\Auth\User;

class Company extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'name',
        'status',
    ];

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
