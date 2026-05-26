<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'avatar' => ['nullable', 'image', 'max:1024'], // 1MB Max
        ]);

        $user->name = $request->name;

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists and not default
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $path;
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:6'],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function updateEmail(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        if ($user->hasVerifiedEmail() && $request->email === $user->email) {
            return response()->json([
                'message' => 'Email is already verified and up to date.',
                'user' => $user,
                'email_changed' => false,
            ]);
        }

        if ($request->email !== $user->email) {
            $user->email = $request->email;
            $user->email_verified_at = null;
            $user->save();
            
            $user->sendEmailVerificationNotification();

            return response()->json([
                'message' => 'Email updated. Please verify your new email address.',
                'user' => $user,
                'email_changed' => true,
            ]);
        }

        return response()->json([
            'message' => 'Email is already up to date.',
            'user' => $user,
            'email_changed' => false,
        ]);
    }

    public function updatePreferences(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'preferences' => ['required', 'array'],
        ]);

        $prefs = $request->preferences;

        // Security: Prevent enabling Telegram 2FA if no Telegram ID is linked
        if (isset($prefs['two_factor_telegram']) && $prefs['two_factor_telegram'] && !$user->telegram_user_id) {
            return response()->json([
                'message' => 'Cannot enable Telegram 2FA without a linked Telegram account.',
            ], 422);
        }

        $user->preferences = $prefs;
        $user->save();

        return response()->json([
            'message' => 'Preferences updated successfully.',
            'preferences' => $user->preferences,
        ]);
    }

    public function linkTelegram(Request $request)
    {
        $authData = $request->all();
        $telegram = new \App\Services\TelegramService();

        if (!$telegram->verifyAuthData($authData)) {
            return response()->json(['message' => 'Invalid Telegram authentication data.'], 403);
        }

        $user = $request->user();
        
        // Optional: check if this telegram_id is already linked to another user
        $exists = \App\Models\Auth\User::where('telegram_user_id', $authData['id'])
            ->where('id', '!=', $user->id)
            ->exists();
            
        if ($exists) {
            return response()->json(['message' => 'This Telegram account is already linked to another user.'], 422);
        }

        $user->telegram_user_id = $authData['id'];
        $user->save();

        return response()->json([
            'message' => 'Telegram account linked successfully.',
            'telegram_user_id' => $user->telegram_user_id,
        ]);
    }
}
