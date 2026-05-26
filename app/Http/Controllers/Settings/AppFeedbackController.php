<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\System\AppFeedback;

class AppFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = AppFeedback::with('employee.designation');

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('message', 'like', "%{$request->search}%")
                  ->orWhereHas('employee', function ($eq) use ($request) {
                      $eq->where('full_name', 'like', "%{$request->search}%");
                  });
            });
        }

        $feedbacks = $query->latest()->paginate(10);

        return response()->json($feedbacks);
    }

    public function destroy($id)
    {
        $feedback = AppFeedback::findOrFail($id);
        $feedback->delete();

        return response()->json(['message' => 'Feedback deleted successfully']);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:pending,reviewed,resolved'
        ]);

        $feedback = AppFeedback::findOrFail($id);
        $feedback->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Feedback status updated',
            'data' => $feedback
        ]);
    }
}
