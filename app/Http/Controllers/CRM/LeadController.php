<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\Lead;
use App\Models\CRM\LeadNote;
use App\Services\TelegramService;
use App\Models\Auth\User;
use App\Notifications\CRM\LeadMentionNotification;
use App\Notifications\CRM\LeadAssignedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Http\Resources\CRM\LeadResource;
use App\Http\Resources\CRM\LeadNoteResource;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        if ($request->boolean('compact')) {
            return LeadResource::collection(
                Lead::select(['id', 'ulid', 'lead_number', 'title', 'branch_id'])
                    ->latest()
                    ->get()
            );
        }

        $query = Lead::select([
            'id', 'ulid', 'lead_number', 'title', 'expected_value',
            'source', 'probability', 'expected_close_date', 'lost_reason', 'is_active',
            'contact_id', 'stage_id', 'assigned_to', 'created_at', 'branch_id'
        ])
        ->with([
            'contact:id,name,image,category_id',  // image needed for image_url accessor
            'contact.category:id,name,color',      // needed for board card badge
            'stage:id,name,color',
            'assignee:id,name',
        ])
        ->withCount('notes');

        if ($request->filled('stage_id')) {
            $query->where('stage_id', $request->stage_id);
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('contact_id')) {
            $query->where('contact_id', $request->contact_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('lead_number', 'like', "%{$search}%")
                  ->orWhereHas('contact', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->paginate === 'false') {
            return LeadResource::collection($query->latest()->get());
        }

        return LeadResource::collection($query->latest()->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'contact_id' => 'required|exists:crm_contacts,id',
            'stage_id' => 'required|exists:crm_lead_pipeline_stages,id',
            'title' => 'required|string|max:255',
            'expected_value' => 'nullable|numeric',
            'probability' => 'nullable|integer|min:0|max:100',
            'source' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'expected_close_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if (array_key_exists('expected_value', $validated) && is_null($validated['expected_value'])) {
            $validated['expected_value'] = 0;
        }
        if (array_key_exists('probability', $validated) && is_null($validated['probability'])) {
            $validated['probability'] = 0;
        }

        return DB::transaction(function () use ($validated) {
            if (empty($validated['branch_id'])) {
                $user = auth()->user();
                $validated['branch_id'] = $user?->branches()->orderByPivot('is_primary', 'desc')->first()?->id ?? 1;
            }
            
            $lead = Lead::create($validated);

            if (!empty($validated['notes'])) {
                $lead->notes()->create([
                    'user_id' => auth()->id() ?? 1,
                    'content' => $validated['notes']
                ]);
            }

            if ($lead->assigned_to) {
                $this->notifyAssignee($lead);
            }

            return new LeadResource($lead->load(['contact.category', 'stage', 'assignee']));
        });
    }

    public function show(Lead $lead)
    {
        return new LeadResource($lead->load(['contact.category', 'stage', 'assignee', 'notes.user'])->loadCount('notes'));
    }

    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'stage_id' => 'sometimes|required|exists:crm_lead_pipeline_stages,id',
            'title' => 'sometimes|required|string|max:255',
            'expected_value' => 'nullable|numeric',
            'probability' => 'nullable|integer|min:0|max:100',
            'source' => 'nullable|string',
            'assigned_to' => 'nullable|exists:users,id',
            'expected_close_date' => 'nullable|date',
            'lost_reason' => 'nullable|string',
            'branch_id' => 'sometimes|required|exists:branches,id',
        ]);

        if (array_key_exists('expected_value', $validated) && is_null($validated['expected_value'])) {
            $validated['expected_value'] = 0;
        }
        if (array_key_exists('probability', $validated) && is_null($validated['probability'])) {
            $validated['probability'] = 0;
        }

        $oldAssignee = $lead->assigned_to;
        $lead->update($validated);

        if ($lead->assigned_to && $lead->assigned_to != $oldAssignee) {
            $this->notifyAssignee($lead);
        }

        return new LeadResource($lead->load(['contact.category', 'stage', 'assignee']));
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->json(null, 204);
    }

    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:crm_leads,id',
            'is_active' => 'sometimes|boolean',
            'stage_id' => 'sometimes|exists:crm_lead_pipeline_stages,id'
        ]);

        $updateData = array_intersect_key($validated, array_flip(['is_active', 'stage_id']));
        
        if (empty($updateData)) {
            return response()->json(['message' => 'No update data provided'], 422);
        }

        Lead::whereIn('id', $validated['ids'])->update($updateData);

        return response()->json(['message' => 'Success']);
    }

    public function addNote(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'content' => 'required|string'
        ]);

        $note = $lead->notes()->create([
            'user_id' => auth()->id() ?? 1,
            'content' => $validated['content']
        ]);

        // Detect mentions: @[User Name]
        preg_match_all('/@\[([^\]]+)\]/', $validated['content'], $matches);
        if (!empty($matches[1])) {
            $usernames = $matches[1];
            $mentionedUsers = User::whereIn('name', $usernames)->get();
            
            $author = auth()->user() ?? User::find(1);
            $snippet = mb_strimwidth($validated['content'], 0, 50, "...");

            foreach ($mentionedUsers as $user) {
                if ($user->id !== auth()->id()) {
                    $user->notify(new LeadMentionNotification($lead, $author, $snippet));
                }
            }
        }

        return new LeadNoteResource($note->load('user'));
    }

    /**
     * Notify the assigned user via Telegram.
     */
    protected function notifyAssignee(Lead $lead)
    {
        $assignee = $lead->assignee;
        if (!$assignee) {
            return;
        }

        $author = auth()->user() ?? User::find(1);
        
        // Internal System Notification (DB + Realtime)
        $assignee->notify(new LeadAssignedNotification($lead, $author));

        // Telegram Notification
        if ($assignee->telegram_user_id) {
            $appUrl = config('app.url');
            $leadLink = "{$appUrl}/dashboard/leads?ulid={$lead->ulid}";

            $message = "🔔 *New Lead Assigned*\n\n";
            $message .= "*Title:* {$lead->title}\n";
            $message .= "*Contact:* {$lead->contact->name}\n";
            $message .= "*Expected Value:* " . number_format($lead->expected_value, 2) . "\n\n";
            $message .= "🔗 [View Lead Details]({$leadLink})";

            try {
                $telegram = app(TelegramService::class);
                $telegram->sendMessage($assignee->telegram_user_id, $message, 'Markdown');
            } catch (\Exception $e) {
                Log::error("Failed to send Telegram notification to user {$assignee->id}: " . $e->getMessage());
            }
        }
    }
}
