<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\HR\Employee;
use Illuminate\Support\Facades\Auth;

class AuthenticateEmployeeByToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // 1. If already authenticated via web session, proceed
        if (Auth::guard('web')->check()) {
            return $next($request);
        }

        // 2. Try to verify the token from the Authorization header
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if ($token) {
            $cleanToken = str_replace('Bearer ', '', $token);

            // A. Try Employee custom auth_token first
            $employee = Employee::where('auth_token', $cleanToken)->first();
            if ($employee) {
                Auth::guard('web')->setUser($employee);
                Auth::setUser($employee);
                return $next($request);
            }

            // B. Try Sanctum (for Admins/Users)
            // This allows the middleware to recognize standard Sanctum tokens
            if ($user = Auth::guard('sanctum')->user()) {
                Auth::guard('web')->setUser($user);
                Auth::setUser($user);
                return $next($request);
            }
        }

        return $next($request);
    }
}
