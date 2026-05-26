<?php

namespace App\Http\Resources\CRM;

use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this->resource) return null;

        return [
            'id' => $this->id,
            'ulid' => $this->ulid,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'type' => $this->type,
            'company_name' => $this->company_name,
            'position' => $this->position,
            'image' => $this->image,
            'image_url' => $this->image_url,
            'source' => $this->source,
            'category_id' => $this->category_id,
            'parent_id' => $this->parent_id,
            'google_map_link' => $this->google_map_link,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'notes' => $this->notes,
            'is_converted' => (bool)$this->is_converted,
            'is_already_customer' => $this->is_converted || ($this->phone && \App\Models\CRM\Customer::where('phone', $this->phone)->exists()),
            'is_phone_duplicate' => !$this->is_converted && ($this->phone && \App\Models\CRM\Customer::where('phone', $this->phone)->exists()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => new ContactCategoryResource($this->whenLoaded('category')),
            'attachments' => $this->whenLoaded('attachments'),
        ];
    }
}
