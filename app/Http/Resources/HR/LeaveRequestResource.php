<?php

namespace App\Http\Resources\HR;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveRequestResource extends JsonResource
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
            'employee_id' => $this->employee_id,
            'leave_type_id' => $this->leave_type_id,
            'duration_type' => $this->duration_type,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date->format('Y-m-d'),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'total_days' => (float) $this->total_days,
            'reason' => $this->reason,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'rejection_reason' => $this->rejection_reason,
            'actioned_at' => $this->actioned_at ? $this->actioned_at->toISOString() : null,
            'attachments' => $this->attachments,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
            
            // Optimized Relations
            'employee' => $this->whenLoaded('employee', function () {
                return [
                    'id' => $this->employee->id,
                    'full_name' => $this->employee->full_name,
                    'employee_id' => $this->employee->employee_id,
                    'profile_image_url' => $this->employee->profile_image_url,
                ];
            }),
            'leave_type' => $this->whenLoaded('leaveType', function () {
                return [
                    'id' => $this->leaveType->id,
                    'name' => $this->leaveType->name,
                    'color' => $this->leaveType->color,
                ];
            }),
            'approver' => $this->whenLoaded('approver', function () {
                return [
                    'id' => $this->approver->id,
                    'full_name' => $this->approver->full_name,
                ];
            }),
        ];
    }
}
