<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Branch;
use App\Traits\LogsSystemActivity;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use App\Traits\ScopesByBranch;

class PaymentAccount extends Model
{
    use HasFactory, LogsSystemActivity, HasUlids, ScopesByBranch;

    public function getRouteKeyName()
    {
        return 'ulid';
    }

    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    protected $fillable = [
        'name',
        'type',
        'logo',
        'account_no',
        'branch_id',
        'balance',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'balance' => 'decimal:2',
    ];

    protected $appends = ['logo_url', 'formatted_account_no'];

    public function getLogoUrlAttribute()
    {
        return $this->logo ? \Illuminate\Support\Facades\Storage::url($this->logo) : null;
    }

    public function getFormattedAccountNoAttribute()
    {
        if (!$this->account_no) return null;
        // Group by 3 digits
        return preg_replace('/(\d{3})(?=\d)/', '$1 ', $this->account_no);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function deposits()
    {
        return $this->hasMany(\App\Models\Sales\SalesOrderDeposit::class, 'payment_account_id');
    }
}
