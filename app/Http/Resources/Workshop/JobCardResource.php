<?php
namespace App\Http\Resources\Workshop;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_no' => $this->job_no,
            'status' => $this->status,
            'type' => $this->type,
            'mileage_in' => $this->mileage_in,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'customer' => $this->whenLoaded('customer', function() {
                return [
                    'id' => $this->customer->id,
                    'name' => $this->customer->name,
                    'phone' => $this->customer->phone,
                    'customer_no' => $this->customer->customer_no,
                ];
            }),
            'vehicle' => $this->whenLoaded('vehicle', function() {
                return [
                    'id' => $this->vehicle->id,
                    'plate_number' => $this->vehicle->plate_number,
                    'vin_last_4' => $this->vehicle->vin_last_4,
                    'color' => $this->vehicle->color,
                    'year' => $this->vehicle->year,
                    'brand' => $this->vehicle->brand ? [
                        'id' => $this->vehicle->brand->id,
                        'name' => $this->vehicle->brand->name,
                        'image' => $this->vehicle->brand->image,
                    ] : null,
                    'model' => $this->vehicle->model ? [
                        'id' => $this->vehicle->model->id,
                        'name' => $this->vehicle->model->name,
                    ] : null,
                ];
            }),
            'items_count' => $this->items_count,
            'replacements_count' => $this->replacements_count,
            'branch' => $this->whenLoaded('branch', function() {
                return [
                    'id' => $this->branch->id,
                    'name' => $this->branch->name,
                    'code' => $this->branch->code,
                ];
            }),
            'lead_technician' => $this->whenLoaded('leadTechnician', function() {
                return [
                    'id' => $this->leadTechnician->id,
                    'full_name' => $this->leadTechnician->full_name,
                    'profile_image_url' => $this->leadTechnician->profile_image_url,
                ];
            }),
            'qc_inspector_name' => $this->qc_inspector_name,
            'qc_inspector_id' => $this->qc_inspector_id,
            'qc_inspector_avatar' => $this->qc_inspector_avatar,
            'created_at' => $this->created_at,
        ];
    }
}
