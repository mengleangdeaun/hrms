<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Communication\TelegramBroadcastAction;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramBroadcastController extends Controller
{
    /**
     * List all broadcast actions.
     */
    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');
        $globalActions = TelegramBroadcastAction::whereNull('branch_id')->orderBy('category')->orderBy('label')->get();

        if (!$branchId) {
            return $globalActions;
        }

        $branchActions = TelegramBroadcastAction::where('branch_id', $branchId)->get()->keyBy('action_key');

        return $globalActions->map(function($global) use ($branchActions, $branchId) {
            $branch = $branchActions->get($global->action_key);
            
            // If branch setting exists, we use it. 
            // If not, we show global values but with a flag so the UI knows it's an override-candidate.
            return [
                'id'            => $branch ? $branch->id : $global->id,
                'action_key'    => $global->action_key,
                'label'         => $global->label,
                'category'      => $global->category,
                'chat_id'       => $branch ? $branch->chat_id : $global->chat_id,
                'topic_id'      => $branch ? $branch->topic_id : $global->topic_id,
                'is_enabled'    => $branch ? $branch->is_enabled : $global->is_enabled,
                'custom_remark' => $branch ? $branch->custom_remark : $global->custom_remark,
                'is_override'   => $branch ? true : false,
                'branch_id'     => $branchId,
            ];
        });
    }

    /**
     * Update a broadcast action.
     */
    public function update(Request $request, $id)
    {
        $branchId = $request->input('branch_id');
        $current = TelegramBroadcastAction::findOrFail($id);
        
        $validated = $request->validate([
            'chat_id'       => 'nullable|string',
            'topic_id'      => 'nullable|string',
            'is_enabled'    => 'required|boolean',
            'custom_remark' => 'nullable|string',
        ]);

        if ($branchId) {
            $action = TelegramBroadcastAction::updateOrCreate(
                ['action_key' => $current->action_key, 'branch_id' => $branchId],
                array_merge($validated, [
                    'label' => $current->label,
                    'category' => $current->category
                ])
            );
        } else {
            $current->update($validated);
            $action = $current;
        }

        return response()->json([
            'message' => 'Broadcast setting updated.',
            'action'  => $action
        ]);
    }

    /**
     * Send a test message for a specific action.
     */
    public function test(Request $request, $id)
    {
        try {
            $branchId = $request->input('branch_id');
            $action = TelegramBroadcastAction::findOrFail($id);

            // Prioritize request data if provided (allows testing unsaved UI changes)
            $chatId = $request->input('chat_id', $action->chat_id);
            $topicId = $request->input('topic_id', $action->topic_id);
            $isEnabled = $request->input('is_enabled', $action->is_enabled);

            if ($branchId && !$request->has('chat_id')) {
                $override = TelegramBroadcastAction::where('action_key', $action->action_key)
                    ->where('branch_id', $branchId)
                    ->first();
                if ($override) {
                    $chatId = $override->chat_id;
                    $topicId = $override->topic_id;
                    $isEnabled = $override->is_enabled;
                }
            }

            if (!$isEnabled || empty($chatId)) {
                return response()->json(['success' => false, 'message' => 'Cannot send test: Action is disabled or Chat ID is missing.'], 422);
            }

            $service = new TelegramService($branchId);
            
            // Create some dummy data for the test based on category
            $dummy = $this->getDummyData($action->action_key);
            
            // Temporarily mock the config values for this broadcast if provided in request
            // This is just for the test broadcast, it doesn't save to DB.
            $result = $service->broadcast($action->action_key, $dummy, [
                'chat_id' => $chatId,
                'topic_id' => $topicId
            ]);

            if ($result) {
                return response()->json(['success' => true, 'message' => 'Test message sent to Telegram!']);
            }

            return response()->json(['success' => false, 'message' => 'Failed to send test. Check your Telegram Bot Token and Chat ID.'], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Broadcasting Error: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Delete a branch-specific broadcast setting override.
     */
    public function destroy($id)
    {
        $action = TelegramBroadcastAction::findOrFail($id);
        
        if (!$action->branch_id) {
            return response()->json(['message' => 'Cannot delete global default settings.'], 403);
        }

        $action->delete();

        return response()->json(['message' => 'Broadcast setting reset to global default.']);
    }

    private function getDummyData($key)
    {
        // Simple generic object with properties that formatters expect
        $data = new \stdClass();
        $data->id = '999';
        $data->order_no = 'TEST-ORD-12345';
        $data->order_qty = 5;
        $data->po_number = 'TEST-PO-001';
        $data->job_no = 'TEST-JOB-99';
        $data->job_card_id = 123;
        $data->adjustment_no = 'TEST-ADJ-001';
        $data->adjustment_qty = 10;
        $data->transfer_no = 'TEST-TRF-001';
        $data->grand_total = 1500.50;
        $data->discount_total = 100.00;
        $data->date = now();
        $data->status = 'Approved';
        $data->receive_date = now();
        $data->qty_received = 50;
        $data->activity_date = now();
        $data->activity_type = 'Store Check';
        $data->latitude = 11.5564;
        $data->longitude = 104.9282;
        $data->description = 'Regular site activity logging test.';
        $data->rating = 5;
        $data->quantity = 1;
        $data->total_days = 3.5;
        $data->start_date = now();
        $data->end_date = now()->addDays(3);
        $data->clock_in_time = now()->subHours(9);
        $data->session_1_out_time = now()->subHours(5);
        $data->session_2_in_time = now()->subHours(4);
        $data->clock_out_time = now();
        $data->in_status = 'In-On time';
        $data->out_status = 'Out-On time';
        $data->late_reason = 'Traffic congestion';
        $data->early_departure_reason = 'Personal emergency';
        $data->notes = 'Test Adjustment/Transfer notes for broadcasting.';
        
        // Mock relationships
        $rel = new \stdClass();
        $rel->name = 'Tester Mengleang';
        $rel->full_name = 'Tester Mengleang';
        $rel->plate_number = 'VIP-8888';
        
        $data->customer = $rel;
        $data->vehicle = $rel;
        $data->creator = $rel;
        $data->user = $rel; // Added user property for Stock Adjustment/Transfer
        $data->supplier = $rel;
        $data->location = $rel;
        $data->fromLocation = $rel;
        $data->toLocation = $rel;
        $data->leadTechnician = $rel;
        $data->qcPerson = $rel;
        $data->mistakeStaff = $rel;
        $data->employee = $rel;
        $data->leaveType = $rel;
        $data->branch = $rel;
        
        // Nested mock for PR
        $data->purchaseOrder = $data;
        $data->jobCard = $data;
        $data->jobCardItem = new \stdClass();
        $data->jobCardItem->part = $rel;
        $data->reason = $rel;

        // Collection mock for items
        $itemMock = new \stdClass();
        $itemMock->part = $rel;
        $itemMock->service = $rel;
        $itemMock->completion_percentage = 85;
        $itemMock->name = 'Test Service Name';
        
        $data->items = collect([$itemMock, $itemMock]);

        // Added missing shift fields
        $data->opened_at = now()->subHours(2);
        $data->closed_at = now();
        $data->total_sales_count = 15;
        $data->total_amount_collected = 1250.75;
        $data->account_summary = [
            ['name' => 'Cash', 'amount' => 1000],
            ['name' => 'ABA Bank', 'amount' => 250.75]
        ];

        // Mock for Sales Order Deposit
        $data->amount = 500.25;
        $data->deposit_date = now();
        $data->order = (object)[
            'order_no'       => 'TEST-ORD-12345',
            'paid_amount'    => 500.25,
            'balance_amount' => 1000.25,
        ];
        $data->paymentAccount = $rel;

        // CRM Feedback/Rating Mocks
        $data->overall_rating = 5;
        $data->customer_service_rating = 5;
        $data->technical_team_rating = 4;
        $data->service_rating = 5;
        $data->technical_rating = 5;
        $data->phone_number = '012345678';
        $data->improvement_suggestions = 'Keep up the good work!';
        $data->comment = 'Excellent service and technical skill.';
        $data->issues = ['Long wait time', 'Coffee was cold'];
        $data->service = $rel;

        // Booking Mocks
        $data->booking_date = now()->addDays(2);
        $data->booking_time = '10:30 AM';
        $data->booking_number = 'BK-999-TEST';
        $data->new_vehicle_info = [
            'brand_name' => 'Toyota',
            'model_name' => 'Hilux',
            'year' => '2024'
        ];

        // Specific mock for Daily Report
        $data->report_date = now();
        $data->submitted_at = now();
        $data->branch_name = 'Test Branch (S-Cool)';
        $data->submitter_name = 'Test User';
        $data->report_data = [
            'crm' => ['total' => 12, 'lost' => 2, 'lost_reasons' => ['Price too high' => 1, 'No stock' => 1]],
            'sales' => ['total_count' => 8],
            'finance' => ['collected' => 2450.75],
            'hr' => ['present' => 10, 'absent' => 1],
            'workshop' => [
                'completed_jobs' => 5, 
                'total_tasks' => 18, 
                'avg_completion_time' => '1h 45m',
                'avg_service_rating' => 4.8,
                'avg_technical_rating' => 4.5,
                'breakdown' => ['Heat Protection' => 3, 'Glass Coating' => 2]
            ],
            'inventory' => ['popular_part' => 'Ceramic Film X7', 'movements' => 24, 'damages' => 0]
        ];

        return $data;
    }
}
