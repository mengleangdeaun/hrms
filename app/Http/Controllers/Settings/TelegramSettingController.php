<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Communication\TelegramSetting;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramSettingController extends Controller
{
    public function show(Request $request)
    {
        $branchId = $request->query('branch_id');
        $setting = TelegramSetting::where('branch_id', $branchId)->first();
        
        if (!$setting) {
            return response()->json(null);
        }

        return response()->json([
            'id'              => $setting->id,
            'branch_id'       => $setting->branch_id,
            'bot_username'    => $setting->bot_username,
            'has_token'       => !empty($setting->bot_token),
            'global_chat_id'  => $setting->global_chat_id,
            'global_topic_id' => $setting->global_topic_id,
            'is_active'       => $setting->is_active,
        ]);
    }

    public function save(Request $request)
    {
        $validated = $request->validate([
            'branch_id'       => 'nullable|exists:branches,id',
            'bot_token'       => 'nullable|string',
            'global_chat_id'  => 'nullable|string',
            'global_topic_id' => 'nullable|string',
            'is_active'       => 'boolean',
        ]);

        $branchId = $validated['branch_id'] ?? null;
        $setting = TelegramSetting::firstOrNew(['branch_id' => $branchId]);
        $setting->fill($validated);
        $setting->save();

        return response()->json(['message' => 'Telegram settings saved.']);
    }

    public function test(Request $request)
    {
        $branchId = $request->input('branch_id');
        $service = new TelegramService($branchId);
        $result = $service->testConnection();

        // Update bot_username if successfully connected
        if ($result['success'] && isset($result['bot']['username'])) {
            $setting = TelegramSetting::where('branch_id', $branchId)->first();
            $setting?->update(['bot_username' => $result['bot']['username']]);
        }

        return response()->json($result);
    }
}
