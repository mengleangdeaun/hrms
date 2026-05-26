<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeWish;
use App\Notifications\PwaNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CelebrationController extends Controller
{
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Get today's celebrants (Birthdays and Work Anniversaries).
     */
    public function index(Request $request)
    {
        $auth = $this->getAuthenticatedEmployee($request);
        if (!$auth) return response()->json(['message' => 'Unauthorized'], 401);

        $today = Carbon::today();
        
        $employees = Employee::where('is_active', true)
            ->where('hide_celebration', false)
            ->get();

        $celebrants = [];

        foreach ($employees as $emp) {
            $dob = $emp->date_of_birth;
            $doj = $emp->date_of_joining;

            // 1. Check Birthday
            if ($dob && $dob->month === $today->month && $dob->day === $today->day) {
                $celebrants[] = $this->formatCelebrant($emp, 'birthday');
            }

            // 2. Check Work Anniversary
            if ($doj) {
                $isSameDay = $doj->day === $today->day;
                $diffInMonths = (int) $doj->diffInMonths($today);
                
                $milestone = null;
                if ($isSameDay) {
                    if ($diffInMonths === 3) {
                        $milestone = '3 Months';
                    } elseif ($diffInMonths === 6) {
                        $milestone = '6 Months';
                    } elseif ($diffInMonths > 0 && $diffInMonths % 12 === 0) {
                        $years = $diffInMonths / 12;
                        $milestone = $years . ($years > 1 ? ' Years' : ' Year');
                    }
                }

                if ($milestone) {
                    $celebrants[] = $this->formatCelebrant($emp, 'anniversary', $milestone);
                }
            }
        }

        return response()->json($celebrants);
    }

    private function formatCelebrant(Employee $emp, $type, $milestone = null)
    {
        return [
            'id' => $emp->id,
            'name' => $emp->full_name,
            'type' => $type,
            'milestone' => $milestone,
            'profile_image_url' => $emp->profile_image_url,
            'designation' => $emp->designation?->name ?? 'Team Member',
            'department' => $emp->department?->name ?? 'N/A',
        ];
    }

    /**
     * Send a wish to a celebrant.
     */
    public function storeWish(Request $request)
    {
        $auth = $this->getAuthenticatedEmployee($request);
        if (!$auth) return response()->json(['message' => 'Unauthorized'], 401);

        $validated = $request->validate([
            'receiver_id' => 'required|exists:employees,id',
            'type'        => 'required|in:birthday,anniversary',
            'message'     => 'nullable|string|max:500',
            'image'       => 'nullable|image|max:5120',
        ]);

        $receiver = Employee::findOrFail($validated['receiver_id']);
        if ($receiver->id === $auth->id) {
            return response()->json(['message' => 'You cannot wish yourself!'], 422);
        }

        $year = now()->year;

        // Check for existing wish to prevent spam
        $exists = EmployeeWish::where([
            'sender_id' => $auth->id,
            'receiver_id' => $receiver->id,
            'type' => $validated['type'],
            'year' => $year
        ])->exists();

        if ($exists) {
            return response()->json(['message' => 'You have already sent a wish for this event!'], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('wishes', 'public');
        }

        $wish = EmployeeWish::create([
            'sender_id' => $auth->id,
            'receiver_id' => $receiver->id,
            'type' => $validated['type'],
            'message' => $validated['message'],
            'image_path' => $imagePath,
            'year' => $year,
        ]);

        // Notify Receiver
        $emoji = $validated['type'] === 'birthday' ? '🎂' : '🎊';
        $title = "{$emoji} New {$validated['type']} wish from {$auth->full_name}!";
        
        $receiver->notify(new PwaNotification([
            'type' => 'wish_received',
            'title' => $title,
            'message' => $validated['message'] ?? "Sent you a warm {$validated['type']} wish!",
            'data' => [
                'wish_id' => $wish->id,
                'sender_name' => $auth->full_name,
                'type' => $validated['type']
            ]
        ]));

        return response()->json(['message' => 'Wish sent successfully!', 'wish' => $wish]);
    }

    /**
     * Get wishes received by the authenticated employee.
     */
    public function myWishes(Request $request)
    {
        $auth = $this->getAuthenticatedEmployee($request);
        if (!$auth) return response()->json(['message' => 'Unauthorized'], 401);

        $wishes = EmployeeWish::where('receiver_id', $auth->id)
            ->with('sender:id,full_name,profile_image')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($wishes);
    }

    /**
     * Get basic info for an employee (used by WishPage fallback).
     */
    public function show(Request $request, $id)
    {
        $auth = $this->getAuthenticatedEmployee($request);
        if (!$auth) return response()->json(['message' => 'Unauthorized'], 401);

        $employee = Employee::where('is_active', true)
            ->where('hide_celebration', false)
            ->findOrFail($id);

        return response()->json($this->formatCelebrant($employee, $request->get('type', 'birthday'), $request->get('milestone')));
    }
}

