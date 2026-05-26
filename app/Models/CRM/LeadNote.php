<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Auth\User;

class LeadNote extends Model
{
    use HasFactory;

    protected $table = 'crm_lead_notes';

    protected $fillable = [
        'lead_id',
        'user_id',
        'content',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
