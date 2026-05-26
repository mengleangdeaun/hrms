<?php

namespace App\Models\CRM;

use App\Traits\ScopesByBranch;
use Illuminate\Database\Eloquent\Model;

class CustomerFeedback extends Model
{
    use ScopesByBranch;
    protected $table = 'customer_feedbacks';

    protected $fillable = [
        'branch_id', 'service_id', 
        'customer_service_rating', 'technical_team_rating', 'overall_rating',
        'issues', 'other_issue_details',
        'phone_number', 'improvement_suggestions', 'allow_contact',
        'status'
    ];

    protected $casts = [
        'issues' => 'array',
        'allow_contact' => 'boolean'
    ];

    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class);
    }

    public function service()
    {
        return $this->belongsTo(\App\Models\Workshop\Service::class);
    }
}
