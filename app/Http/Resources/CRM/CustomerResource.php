<?php

namespace App\Http\Resources\CRM;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'customer_code'    => $this->customer_code,
            'customer_no'      => $this->customer_no,
            'name'             => $this->name,
            'phone'            => $this->phone,
            'telegram_user_id' => $this->telegram_user_id,
            'customer_type_id' => $this->customer_type_id, // kept: dialog uses as edit fallback
            'status'           => $this->status,
            'image_url'        => $this->image_url,
            'joined_at'        => $this->joined_at,
            'customer_type'    => $this->customer_type ? [
                'id'   => $this->customer_type->id,
                'name' => $this->customer_type->name,
            ] : null,
        ];
    }
}
