<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this->resource) return null;
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'is_active' => $this->is_active,
            'roles' => $this->whenLoaded('roles', function() {
                return $this->roles->map(fn($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'slug' => $role->slug,
                ]);
            }),
            'branches' => $this->whenLoaded('branches', function() {
                return $this->branches->map(fn($branch) => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'code' => $branch->code,
                    'status' => $branch->status,
                    'is_primary' => (bool) ($branch->pivot?->is_primary),
                ]);
            }),
            'permissions' => $this->when($this->relationLoaded('roles'), function() {
                return $this->roles->flatMap->permissions->pluck('slug')->unique()->values();
            }),
            'employee' => $this->whenLoaded('employee', function() {
                return [
                    'ulid' => $this->employee->ulid,
                    'full_name' => $this->employee->full_name,
                    'employee_id' => $this->employee->employee_id,
                ];
            }),
            'telegram_user_id' => $this->telegram_user_id,
            'preferences' => $this->preferences,
        ];
    }
}
