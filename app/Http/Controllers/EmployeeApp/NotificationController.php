<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\Notification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    private function getNotifiableContext(Request $request)
    {
        $user = null;
        $employee = null;

        // 1. Priority: Bearer Token (PWA / Employee App context)
        // This ensures PWA users are identified by their token even if an Admin session exists in the browser.
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if ($token) {
            $token = str_replace('Bearer ', '', $token);
            $employee = \App\Models\HR\Employee::where('auth_token', $token)->first();
            if ($employee) {
                // Resolve linked User if exists, but prioritize identifying as Employee
                $user = $employee->user ?? \App\Models\Auth\User::whereRaw('LOWER(email) = ?', [strtolower($employee->email)])->first();
            }
        }

        // 2. Fallback: standard Auth (Dashboard / CRM Admin context)
        if (!$employee) {
            $user = Auth::user();
            if ($user && $user instanceof \App\Models\Auth\User) {
                $employee = $user->employee ?? \App\Models\HR\Employee::whereRaw('LOWER(email) = ?', [strtolower($user->email)])->first();
            }
        }

        $contexts = [];
        if ($user) $contexts[] = ['id' => $user->id, 'type' => get_class($user)];
        if ($employee) $contexts[] = ['id' => $employee->id, 'type' => get_class($employee)];

        return [
            'user' => $user,
            'employee' => $employee,
            'contexts' => $contexts
        ];
    }

    private function buildUnifiedQuery(array $contextData, ?string $category = null)
    {
        return Notification::where(function($query) use ($contextData) {
            foreach ($contextData['contexts'] as $ctx) {
                $query->orWhere(function($q) use ($ctx) {
                    $q->where('notifiable_id', $ctx['id'])
                      ->where('notifiable_type', $ctx['type']);
                });
            }
            
            // Backward compatibility for legacy notifications using employee_id column
            if ($contextData['employee']) {
                $query->orWhere('employee_id', $contextData['employee']->id);
            }
        })->when($category, function($q) use ($category) {
            if ($category === 'crm') {
                $q->whereIn('app_category', ['crm', 'system']);
            } elseif ($category === 'pwa') {
                $q->whereIn('app_category', ['pwa', 'system'])
                  ->where(function ($q) {
                      $q->whereNull('pwa_display_type')
                        ->orWhereNotIn('pwa_display_type', ['top_banner', 'home_popup', 'home_image_section']);
                  })
                    ->where(function ($q) {
                        // Only show announcements that have not expired yet
                        // OR are dynamic celebrations (which don't have an announcement_id)
                        $q->where('type', '!=', 'announcement')
                          ->orWhereIn('data->announcement_id', \App\Models\System\Announcement::published()->select('id'))
                          ->orWhere('data->category', 'celebration');
                    });
            } else {
                $q->where('app_category', $category);
            }
        });
    }

    public function index(Request $request)
    {
        $ctx = $this->getNotifiableContext($request);
        if (empty($ctx['contexts'])) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $category = $request->get('category');

        $notifications = $this->buildUnifiedQuery($ctx, $category)
            ->latest()
            ->distinct()
            ->groupBy('id')
            ->limit($request->get('limit', 50))
            ->get();

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        $ctx = $this->getNotifiableContext($request);
        if (empty($ctx['contexts'])) {
            return response()->json(['unread_count' => 0], 401);
        }

        $category = $request->get('category');

        $count = $this->buildUnifiedQuery($ctx, $category)
            ->whereNull('read_at')
            ->distinct()
            ->count('id');

        return response()->json([
            'unread_count' => $count,
            'count' => $count
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $ctx = $this->getNotifiableContext($request);
        if (empty($ctx['contexts'])) return response()->json(['message' => 'Unauthenticated'], 401);

        $notification = $this->buildUnifiedQuery($ctx)->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function markAllRead(Request $request)
    {
        $ctx = $this->getNotifiableContext($request);
        if (empty($ctx['contexts'])) return response()->json(['message' => 'Unauthenticated'], 401);

        $category = $request->get('category');

        $this->buildUnifiedQuery($ctx, $category)->whereNull('read_at')->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }

    public function destroy(Request $request, $id)
    {
        $ctx = $this->getNotifiableContext($request);
        if (empty($ctx['contexts'])) return response()->json(['message' => 'Unauthenticated'], 401);

        $notification = $this->buildUnifiedQuery($ctx)->findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    public function destroyAll(Request $request)
    {
        $ctx = $this->getNotifiableContext($request);
        if (empty($ctx['contexts'])) return response()->json(['message' => 'Unauthenticated'], 401);

        $category = $request->get('category');

        $this->buildUnifiedQuery($ctx, $category)->delete();

        return response()->json(['message' => 'All notifications deleted']);
    }
}
