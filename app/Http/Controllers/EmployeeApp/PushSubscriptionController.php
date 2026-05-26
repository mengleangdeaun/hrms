<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HR\Employee;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    /**
     * Helper to authenticate the employee via the custom token pattern.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Store or update a push subscription.
     */
    public function update(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'endpoint'    => 'required|string',
            'keys.auth'   => 'required|string',
            'keys.p256dh' => 'required|string'
        ]);

        try {
            $employee->updatePushSubscription(
                $request->endpoint,
                $request->keys['p256dh'],
                $request->keys['auth']
            );

            return response()->json([
                'success' => true,
                'message' => 'Push subscription updated'
            ]);
        } catch (\Exception $e) {
            Log::error('Push Subscription Update Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $request->validate([
            'endpoint' => 'required|string'
        ]);

        try {
            $employee->deletePushSubscription($request->endpoint);

            return response()->json([
                'success' => true,
                'message' => 'Push subscription removed'
            ]);
        } catch (\Exception $e) {
            Log::error('Push Subscription Deletion Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }
}
