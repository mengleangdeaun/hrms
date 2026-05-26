<?php

namespace App\Http\Resources\CRM;

use Illuminate\Http\Resources\Json\JsonResource;

class LeadStageResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this->resource) return null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'color' => $this->color,
        ];
    }
}
