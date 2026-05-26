<?php

namespace App\Http\Controllers\Api\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\CustomerFeedback;
use Illuminate\Http\Request;

class CustomerFeedbackController extends Controller
{
    /**
     * Store public feedback
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'service_id' => 'required|exists:services,id',
            'customer_service_rating' => 'required|integer|min:1|max:5',
            'technical_team_rating' => 'required|integer|min:1|max:5',
            'overall_rating' => 'required|integer|min:1|max:5',
            'issues' => 'nullable|array',
            'other_issue_details' => 'nullable|string',
            'phone_number' => 'required|string|min:9',
            'improvement_suggestions' => 'nullable|string',
            'allow_contact' => 'boolean'
        ]);

        $feedback = CustomerFeedback::create($validated);

        // Notify Telegram
        try {
            $feedback->load(['branch', 'service']);
            (new \App\Services\TelegramService($feedback->branch_id))->broadcast('crm.customer_feedback_received', $feedback);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Feedback Telegram Notification Failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Thank you for your valuable feedback!',
            'data' => $feedback
        ], 201);
    }

    /**
     * List feedback (Admin)
     */
    public function index(Request $request)
    {
        $query = CustomerFeedback::with(['branch', 'service'])->latest();

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('phone_number', 'like', "%$search%")
                  ->orWhere('improvement_suggestions', 'like', "%$search%")
                  ->orWhere('other_issue_details', 'like', "%$search%");
            });
        }

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    /**
     * Update status
     */
    public function updateStatus(Request $request, CustomerFeedback $feedback)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,reviewed,actioned'
        ]);

        $feedback->update($validated);

        return response()->json([
            'message' => 'Feedback status updated successfully',
            'data' => $feedback
        ]);
    }

    public function export(Request $request)
    {
        $query = CustomerFeedback::with(['branch', 'service'])->latest();

        if ($request->has('branch_id') && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('phone_number', 'like', "%$search%")
                  ->orWhere('improvement_suggestions', 'like', "%$search%")
                  ->orWhere('other_issue_details', 'like', "%$search%");
            });
        }

        $feedbacks = $query->get();
        $filename = "customer_feedback_" . date('Ymd_His') . ".csv";

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Branch', 'Service', 'CS Rating', 'Tech Rating', 'Overall', 'Phone', 'Suggestions', 'Details', 'Issues', 'Status', 'Date'];

        $callback = function() use($feedbacks, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($feedbacks as $item) {
                fputcsv($file, [
                    $item->id,
                    $item->branch?->name,
                    $item->service?->name,
                    $item->customer_service_rating,
                    $item->technical_team_rating,
                    $item->overall_rating,
                    $item->phone_number,
                    $item->improvement_suggestions,
                    $item->other_issue_details,
                    implode(', ', (array)$item->issues),
                    $item->status,
                    $item->created_at
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
