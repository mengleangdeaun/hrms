<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\System\PwaSetting;
use Illuminate\Http\Request;

class PwaSettingController extends Controller
{
    /**
     * Get the PWA settings.
     */
    public function show()
    {
        $settings = PwaSetting::first() ?? new PwaSetting([
            'version' => '1.0.0',
            'privacy_policy' => '',
            'terms_of_service' => ''
        ]);

        return response()->json($settings);
    }

    /**
     * Update the PWA settings.
     */
    public function update(Request $request)
    {
        $request->validate([
            'version' => 'required|string',
            'privacy_policy' => 'nullable|string',
            'terms_of_service' => 'nullable|string',
        ]);

        $settings = PwaSetting::first();

        if ($settings) {
            $settings->update($request->only(['version', 'privacy_policy', 'terms_of_service']));
        } else {
            $settings = PwaSetting::create($request->only(['version', 'privacy_policy', 'terms_of_service']));
        }

        return response()->json([
            'message' => 'PWA settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * Get the PWA settings for the public/mobile app.
     */
    public function publicInfo()
    {
        $settings = PwaSetting::first();
        
        return response()->json([
            'version' => optional($settings)->version ?? '1.5.0 STABLE',
            'privacy_policy' => optional($settings)->privacy_policy ?? '',
            'terms_of_service' => optional($settings)->terms_of_service ?? '',
            'vapid_public_key' => config('webpush.vapid.public_key')
        ]);
    }
}
