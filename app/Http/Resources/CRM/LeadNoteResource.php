<?php

namespace App\Http\Resources\CRM;

use App\Http\Resources\Auth\UserResource;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadNoteResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this->resource) return null;

        return [
            'id' => $this->id,
            'content' => $this->content,
            'created_at' => $this->created_at,
            'user' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
