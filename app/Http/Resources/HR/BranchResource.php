<?php

namespace App\Http\Resources\HR;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'status' => $this->status,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'zip_code' => $this->zip_code,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'allowed_radius' => $this->allowed_radius,
            'telegram_chat_id' => $this->telegram_chat_id,
            'telegram_topic_id' => $this->telegram_topic_id,
            
            // Centralized Relation (Optional for frontend)
            'telegram_setting' => $this->whenLoaded('telegramSetting', function() {
                return [
                    'id' => $this->telegramSetting->id,
                    'global_chat_id' => $this->telegramSetting->global_chat_id,
                    'global_topic_id' => $this->telegramSetting->global_topic_id,
                ];
            }),
            
            'created_at' => $this->created_at,
        ];
    }
}
