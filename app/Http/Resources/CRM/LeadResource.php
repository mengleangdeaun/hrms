<?php

namespace App\Http\Resources\CRM;

use App\Http\Resources\Auth\UserResource;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this->resource) return null;

        $contact = $this->whenLoaded('contact');

        return [
            'id'             => $this->id,
            'ulid'           => $this->ulid,
            'lead_number'    => $this->lead_number,
            'title'          => $this->title,
            'expected_value' => (float) $this->expected_value,
            'probability'    => (int) $this->probability,
            'source'         => $this->source,
            'expected_close_date' => $this->expected_close_date ? $this->expected_close_date->format('Y-m-d') : null,
            'lost_reason'    => $this->lost_reason,
            'is_active'      => (bool) $this->is_active,
            'stage_id'       => $this->stage_id,
            'branch_id'      => $this->branch_id,
            'created_at'     => $this->created_at,
            'notes_count'    => $this->notes_count,

            // Inline slim shapes — avoids N+1 from ContactResource / UserResource
            'contact' => $this->contact ? [
                'id'        => $this->contact->id,
                'name'      => $this->contact->name,
                'image_url' => $this->contact->image_url,
                'category'  => $this->contact->category ? [
                    'name'  => $this->contact->category->name,
                    'color' => $this->contact->category->color,
                ] : null,
            ] : null,

            'stage'   => new LeadStageResource($this->whenLoaded('stage')),

            'assignee' => $this->assignee ? [
                'id'   => $this->assignee->id,
                'name' => $this->assignee->name,
            ] : null,

            // Full detail fields — only present when loaded via show()
            'notes' => LeadNoteResource::collection($this->whenLoaded('notes')),
        ];
    }
}
