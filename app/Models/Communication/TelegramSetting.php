<?php

namespace App\Models\Communication;
use App\Traits\BelongsToCompany;

use Illuminate\Database\Eloquent\Concerns\HasUlids;

use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsSystemActivity;

class TelegramSetting extends Model
{
    protected $fillable = [
        'branch_id',
        'bot_token',
        'bot_username',
        'global_chat_id',
        'global_topic_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $hidden = ['bot_token'];

    /**
     * Get the settings record for a branch or fallback to global.
     */
    public static function instance(?int $branchId = null): ?self
    {
        $global = static::whereNull('branch_id')->first();
        
        if ($branchId) {
            $setting = static::where('branch_id', $branchId)->first();
            
            // If branch setting exists and has a bot_token, use it.
            // Otherwise, if it exists but NO bot_token, return global but perhaps we should merge? 
            // For now, returning global is safer to ensure connectivity.
            if ($setting && !empty($setting->bot_token)) {
                return $setting;
            }
        }

        return $global;
    }
}


