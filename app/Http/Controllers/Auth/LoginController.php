<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Auth\User;
use App\Http\Resources\Auth\UserResource;
use App\Jobs\ProcessSystemActivityLog;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Cache;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            $user = Auth::user();
            
            // Check if 2FA is enabled via preferences
            $preferences = $user->preferences ?? [];
            $is2FAEnabled = $preferences['two_factor_telegram'] ?? false;

            if ($is2FAEnabled && !empty($user->telegram_user_id)) {
                $otp = rand(100000, 999999);
                
                // Store OTP in cache for 5 minutes
                Cache::put('2fa_otp_' . $user->id, $otp, now()->addMinutes(5));
                
                // Send OTP via Telegram
                try {
                    $telegram = new TelegramService();
                    $telegram->sendOTP($user->telegram_user_id, (string)$otp);
                } catch (\Exception $e) {
                    \Log::error("Failed to send 2FA OTP: " . $e->getMessage());
                    // Fallback: If telegram fails, we might still want to proceed or show error
                }

                // Logout immediately - we will re-login after OTP verification
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return response()->json([
                    'requires_2fa' => true,
                    'user_id' => $user->id,
                    'message' => 'Please enter the 6-digit code sent to your Telegram.',
                ]);
            }

            $request->session()->regenerate();
            $token = $user->createToken('auth-token')->plainTextToken;
            
            // Explicitly save the session for database drivers to ensure 
            // the user_id is updated before the response is sent.
            $request->session()->save();

            // Log successful login
            ProcessSystemActivityLog::dispatch([
                'log_name'     => 'auth',
                'description'  => "user_logged_in",
                'subject_type' => get_class($user),
                'subject_id'   => $user->getKey(),
                'event'        => 'login',
                'causer_type'  => get_class($user),
                'causer_id'    => $user->getKey(),
                'properties'   => [
                    'module'     => 'auth',
                    'ip'         => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ],
            ]);

            return response()->json([
                'user' => new UserResource($user->load('roles.permissions')),
                'token' => $token,
                'message' => 'Login successful',
            ]);
        }

        // Log failed login attempt
        ProcessSystemActivityLog::dispatch([
            'log_name'     => 'auth',
            'description'  => "failed_login_attempt",
            'subject_type' => null,
            'subject_id'   => null,
            'event'        => 'login_failed',
            'causer_type'  => null,
            'causer_id'    => null,
            'properties'   => [
                'module'     => 'auth',
                'email'      => $credentials['email'],
                'ip'         => $request->ip(),
                'user_agent' => $request->userAgent(),
            ],
        ]);

        return response()->json([
            'message' => 'Invalid credentials',
        ], 401);
    }

    public function verify2FA(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp' => 'required|string|size:6',
        ]);

        $cachedOtp = Cache::get('2fa_otp_' . $request->user_id);

        if ($cachedOtp && (string)$cachedOtp === (string)$request->otp) {
            Cache::forget('2fa_otp_' . $request->user_id);
            
            $user = User::find($request->user_id);
            Auth::login($user, $request->boolean('remember'));
            
            $request->session()->regenerate();
            $token = $user->createToken('auth-token')->plainTextToken;
            $request->session()->save();

            return response()->json([
                'user' => new UserResource($user->load('roles.permissions')),
                'token' => $token,
                'message' => 'Login successful',
            ]);
        }

        return response()->json([
            'message' => 'Invalid or expired verification code.',
        ], 422);
    }
    public function loginWithTelegram(Request $request)
    {
        $authData = $request->all();
        $telegram = new TelegramService();

        if (!$telegram->verifyAuthData($authData)) {
            return response()->json(['message' => 'Invalid Telegram authentication data.'], 403);
        }

        $user = User::where('telegram_user_id', $authData['id'])->first();

        if (!$user) {
            return response()->json(['message' => 'This Telegram account is not linked to any user.'], 404);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account is disabled.'], 403);
        }

        Auth::login($user, true); // Always remember for telegram login?
        $request->session()->regenerate();
        $token = $user->createToken('auth-token')->plainTextToken;
        $request->session()->save();

        // Log successful login
        ProcessSystemActivityLog::dispatch([
            'log_name'     => 'auth',
            'description'  => "user_logged_in_via_telegram",
            'subject_type' => get_class($user),
            'subject_id'   => $user->getKey(),
            'event'        => 'login_telegram',
            'causer_type'  => get_class($user),
            'causer_id'    => $user->getKey(),
            'properties'   => [
                'module'     => 'auth',
                'telegram_id' => $authData['id'],
                'ip'         => $request->ip(),
            ],
        ]);

        return response()->json([
            'user' => new UserResource($user->load('roles.permissions')),
            'token' => $token,
            'message' => 'Login successful via Telegram',
        ]);
    }

    public function getTelegramBotName()
    {
        $setting = \App\Models\Communication\TelegramSetting::instance();
        return response()->json([
            'bot_username' => $setting?->bot_username ?? config('services.telegram.bot_username')
        ]);
    }
}

