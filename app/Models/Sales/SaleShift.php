<?php

namespace App\Models\Sales;

use App\Models\Auth\User;
use App\Models\HR\Branch;
use App\Traits\ScopesByBranch;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class SaleShift extends Model
{
    use HasFactory, HasUlids, ScopesByBranch;

    protected $fillable = [
        'branch_id',
        'user_id',
        'opened_at',
        'closed_at',
        'total_sales_count',
        'total_amount_collected',
        'account_summary',
        'status',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'account_summary' => 'array',
        'total_amount_collected' => 'decimal:2',
    ];

    /**
     * Get the columns that should receive a unique identifier.
     *
     * @return array<int, string>
     */
    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Scope for active (open) shifts.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'open');
    }
}
