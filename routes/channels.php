<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.Auth.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Universal Employee Channel Authorization
 * Supports:
 * 1. Web-logged in Users (linked to Employee)
 * 2. Sanctum-logged in Users (linked to Employee)
 * 3. Token-logged in PWA Employees (auth_token)
 */
Broadcast::channel('App.Models.HR.Employee.{id}', function ($user, $id) {
    // 1. Resolve effective identity from token or session
    $employee = null;

    if ($user instanceof \App\Models\HR\Employee) {
        $employee = $user;
    } else {
        $token = request()->header('Authorization') ?? request()->bearerToken();
        if ($token) {
            $token = str_replace('Bearer ', '', $token);
            $employee = \App\Models\HR\Employee::where('auth_token', $token)->first();
        }
    }

    // 2. Validate linked user if still null
    if (!$employee && $user instanceof \App\Models\Auth\User) {
        if (isset($user->employee_id)) {
            $employee = \App\Models\HR\Employee::find($user->employee_id);
        } else {
            $employee = \App\Models\HR\Employee::where('email', $user->email)->first();
        }
    }

    if (!$employee) return false;

    return (int) $employee->id === (int) $id;
});

/**
 * Customer Channel Authorization (TMA)
 */
Broadcast::channel('customer.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Admin Attendance Channel
 */
Broadcast::channel('attendance', function ($user) {
    return $user->can('view_attendance');
});
