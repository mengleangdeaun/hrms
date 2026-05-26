<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Jobs\ProcessSystemActivityLog;
use Illuminate\Support\Facades\Auth;

class AuditSystemActions
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $method = $request->method();
        $isStateChanging = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE']);
        $isReportExport = str_contains($request->path(), 'report') || str_contains($request->path(), 'export');

        // Log state-changing methods OR significant GET actions (reports/exports)
        if (Auth::check() && ($isStateChanging || ($method === 'GET' && $isReportExport))) {
            
            // 1. Skip technical logs for updates/deletes if they are handled by the Eloquent Trait
            if (in_array($method, ['PUT', 'PATCH', 'DELETE'])) {
                $module = $this->getModuleContext($request);
                $businessModules = ['hr', 'inventory', 'stock', 'procurement', 'crm', 'sales', 'workshop', 'qualitycontrol', 'leave', 'attendance', 'finance'];
                
                if (in_array($module, $businessModules)) {
                    return $response;
                }
            }

            // 2. Skip common non-business actions or logging endpoints to prevent recursion
            $skippedPaths = [
                'api/settings/system-logs',
                'api/broadcasting/auth',
                'api/login',
                'api/register',
            ];

            if ($this->shouldLog($request, $skippedPaths)) {
                $user = Auth::user();

                ProcessSystemActivityLog::dispatch([
                    'log_name'     => 'request',
                    'description'  => "Performed {$method} action on {$request->path()}",
                    'subject_type' => null,
                    'subject_id'   => null,
                    'event'        => strtolower($method),
                    'causer_type'  => get_class($user),
                    'causer_id'    => $user->getKey(),
                    'properties'   => [
                        'module'      => $this->getModuleContext($request),
                        'url'         => $request->fullUrl(),
                        'method'      => $method,
                        'input'       => $this->filterInput($request->all()),
                        'status'      => $response->getStatusCode(),
                        'ip'          => $request->ip(),
                        'user_agent'  => $request->userAgent(),
                    ],
                ]);
            }
        }

        return $response;
    }

    protected function shouldLog(Request $request, array $skippedPaths): bool
    {
        foreach ($skippedPaths as $path) {
            // Only skip GET requests for these paths (except auth ones which we skip entirely)
            if ($request->is($path)) {
                if ($request->isMethod('GET') || in_array($path, ['api/login', 'api/register'])) {
                    return false;
                }
            }
        }
        return true;
    }

    protected function getModuleContext(Request $request): string
    {
        $path = $request->path();

        // 1. Identify Reports & Exports (High Priority)
        if (str_contains($path, 'report') || str_contains($path, 'export')) {
            return 'reports';
        }

        // 2. Specific Path Overrides
        if ($request->is('api/user/preferences') || $request->is('api/profile/*')) {
            return 'profile';
        }

        if ($request->is('api/settings/*') || $request->is('api/system-health') || $request->is('api/health*')) {
            return 'settings';
        }

        if ($request->is('api/services/*') || $request->is('api/job-cards/*')) {
            return 'workshop';
        }

        if ($request->is('api/login') || $request->is('api/auth/*')) {
            return 'auth';
        }

        // 3. Map PWA to Attendance/HR context
        if ($request->is('api/employee-app/*')) {
            return 'attendance';
        }

        // 4. Map segments to core modules or default to system
        $segment = $request->segment(2);
        
        $businessMapping = [
            'stock'           => 'inventory',
            'procurement'     => 'inventory',
            'inventory'       => 'inventory',
            'hr'              => 'hr',
            'leave'           => 'hr',
            'attendance'      => 'attendance',
            'sales'           => 'sales',
            'customers'       => 'crm',
            'crm'             => 'crm',
            'finance'         => 'finance',
            'workshop'        => 'workshop',
            'qualitycontrol'  => 'workshop',
        ];

        if ($segment && isset($businessMapping[$segment])) {
            return $businessMapping[$segment];
        }

        // Group low-level system tasks
        $systemSegments = ['media', 'access-control', 'notifications', 'push-subscriptions', 'broadcasting', 'telescope', 'backups', 'logs', 'system-logs'];
        if ($segment && in_array($segment, $systemSegments)) {
            return 'system';
        }

        return $segment ?: 'system';
    }


    protected function filterInput(array $input): array
    {
        $sensitiveFields = ['password', 'password_confirmation', 'token', 'secret', 'key', 'bot_token'];
        
        foreach ($input as $key => $value) {
            if (in_array(strtolower($key), $sensitiveFields)) {
                $input[$key] = '********';
            }
        }

        return $input;
    }
}
