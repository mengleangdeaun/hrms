<?php
namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class ContactCategory extends Model
{
    use HasFactory, LogsSystemActivity;

    protected $table = 'crm_contact_categories';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'is_system',
        'is_active',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function contacts()
    {
        return $this->hasMany(Contact::class, 'category_id');
    }
}
