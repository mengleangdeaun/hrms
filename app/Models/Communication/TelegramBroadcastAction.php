<?php

namespace App\Models\Communication;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class TelegramBroadcastAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'action_key',
        'label',
        'category',
        'chat_id',
        'topic_id',
        'is_enabled',
        'custom_remark',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];
}


