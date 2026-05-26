<?php

namespace App\Http\Resources\HR;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
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
            'status' => $this->status,
            'description' => $this->description,
            'telegram_chat_id' => $this->telegram_chat_id,
            'telegram_topic_id' => $this->telegram_topic_id,
            
            // Minimalist branches
            'branches' => $this->whenLoaded('branches', function() {
                return $this->branches->map(fn($branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ]);
            }),
            
            'created_at' => $this->created_at,
        ];
    }
}
