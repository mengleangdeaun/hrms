<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\LogsSystemActivity;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use App\Models\Auth\User;
use App\Traits\ScopesByBranch;

class Lead extends Model
{
    use HasFactory, SoftDeletes, LogsSystemActivity, HasUlids, ScopesByBranch;

    protected $table = 'crm_leads';

    protected $fillable = [
        'ulid',
        'contact_id',
        'stage_id',
        'lead_number',
        'title',
        'expected_value',
        'probability',
        'source',
        'assigned_to',
        'expected_close_date',
        'lost_reason',
        'is_active',
        'branch_id',
    ];

    protected $casts = [
        'expected_value' => 'decimal:2',
        'expected_close_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function booted()
    {
        static::creating(function ($lead) {
            if (!$lead->lead_number) {
                $lead->lead_number = app(\App\Services\DocumentNumberService::class)->generate('lead', $lead->branch_id);
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'ulid';
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function stage()
    {
        return $this->belongsTo(LeadPipelineStage::class, 'stage_id');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function notes()
    {
        return $this->hasMany(LeadNote::class)->latest();
    }
}
