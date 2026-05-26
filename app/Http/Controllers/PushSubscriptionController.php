<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    /**
     * Store or update a push subscription for the authenticated user.
     */
    public function update(Request $request)
    {
        $request->validate([
            'endpoint'    => 'required|string',
            'keys.auth'   => 'required|string',
            'keys.p256dh' => 'required|string'
        ]);

        try {
            $user = $request->user();
            
            $user->updatePushSubscription(
                $request->endpoint,
                $request->keys['p256dh'],
                $request->keys['auth']
            );

            return response()->json([
                'success' => true,
                'message' => 'Push subscription updated'
            ]);
        } catch (\Exception $e) {
            Log::error('Admin Push Subscription Update Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string'
        ]);

        try {
            $request->user()->deletePushSubscription($request->endpoint);

            return response()->json([
                'success' => true,
                'message' => 'Push subscription removed'
            ]);
        } catch (\Exception $e) {
            Log::error('Admin Push Subscription Deletion Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }
}
