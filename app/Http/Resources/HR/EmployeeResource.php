<?php

namespace App\Http\Resources\HR;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
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
            'ulid' => $this->ulid,
            'full_name' => $this->full_name,
            'employee_id' => $this->employee_id,
            'email' => $this->email,
            'phone' => $this->phone,
            'gender' => $this->gender,
            'profile_image_url' => $this->profile_image_url,
            'employee_code' => $this->employee_code,
            'is_active' => (bool) $this->is_active,
            'is_technician' => (bool) $this->is_technician,
            'is_qc_person' => (bool) $this->is_qc_person,
            'employment_type' => $this->employment_type,
            'base_salary' => $this->base_salary,
            'hide_celebration' => (bool) $this->hide_celebration,

            // Relations (IDs for form binding)
            'branch_id' => $this->branch_id,
            'department_id' => $this->department_id,
            'designation_id' => $this->designation_id,
            'line_manager_id' => $this->line_manager_id,
            'working_shift_id' => $this->working_shift_id,
            'attendance_policy_id' => $this->attendance_policy_id,
            
            // Relations (Objects for display)
            'branch' => $this->whenLoaded('branch', function() {
                return [
                    'id' => $this->branch->id,
                    'name' => $this->branch->name,
                ];
            }),
            'department' => $this->whenLoaded('department', function() {
                return [
                    'id' => $this->department->id,
                    'name' => $this->department->name,
                ];
            }),
            'designation' => $this->whenLoaded('designation', function() {
                return [
                    'id' => $this->designation->id,
                    'name' => $this->designation->name,
                ];
            }),
            'working_shift' => $this->whenLoaded('workingShift', function() {
                return [
                    'id' => $this->workingShift->id,
                    'name' => $this->workingShift->name,
                ];
            }),
            'attendance_policy' => $this->whenLoaded('attendancePolicy', function() {
                return [
                    'id' => $this->attendancePolicy->id,
                    'name' => $this->attendancePolicy->name,
                ];
            }),
            
            // Contact Info
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'city' => $this->city,
            'state' => $this->state,
            'country' => $this->country,
            'postal_code' => $this->postal_code,
            'emergency_contact_name' => $this->emergency_contact_name,
            'emergency_contact_relationship' => $this->emergency_contact_relationship,
            'emergency_contact_phone' => $this->emergency_contact_phone,

            // Banking Info
            'bank_name' => $this->bank_name,
            'account_holder_name' => $this->account_holder_name,
            'account_number' => $this->account_number,
            'tax_payer_id' => $this->tax_payer_id,

            // Documents
            'documents' => $this->whenLoaded('documents', function() {
                return $this->documents->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'document_type_id' => $doc->document_type_id,
                        'media_url' => $doc->profile_image_url ?? \Illuminate\Support\Facades\Storage::url($doc->file_path),
                        'media_name' => $doc->original_name,
                        'document_type' => $doc->documentType ? [
                            'id' => $doc->documentType->id,
                            'name' => $doc->documentType->name,
                        ] : null,
                    ];
                });
            }),

            // Dates
            'date_of_birth' => $this->date_of_birth ? $this->date_of_birth->format('Y-m-d') : null,
            'date_of_joining' => $this->date_of_joining ? $this->date_of_joining->format('Y-m-d') : null,
            'created_at' => $this->created_at,
        ];
    }
}
