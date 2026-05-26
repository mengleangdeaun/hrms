<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\AppFeedback;

class AppFeedbackController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'device_info' => 'nullable|array',
        ]);

        $feedback = AppFeedback::create([
            'employee_id' => $request->user()?->employee?->id,
            'message' => $request->message,
            'device_info' => $request->device_info,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Your feedback has been submitted successfully. Thank you for helping us improve!',
            'data' => $feedback
        ]);
    }
}
