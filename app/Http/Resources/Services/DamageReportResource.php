<?php

namespace App\Http\Resources\Services;

use Illuminate\Http\Resources\Json\JsonResource;

class DamageReportResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this->resource) return null;

        return [
            'id' => $this->id,
            'job_card_id' => $this->job_card_id,
            'job_card' => [
                'job_no' => $this->jobCard->job_no ?? 'N/A',
                'customer' => [
                    'name' => $this->jobCard->customer->name ?? 'N/A',
                ],
                'branch' => [
                    'name' => $this->jobCard->branch->branch_name ?? 'N/A',
                ],
            ],
            'job_card_item' => [
                'part' => [
                    'name' => $this->jobCardItem->part->name ?? 'N/A',
                ],
            ],
            'serial' => $this->serial ? [
                'id' => $this->serial->id,
                'serial_number' => $this->serial->serial_number,
                'current_quantity' => $this->serial->current_quantity,
                'product' => [
                    'name' => $this->serial->product->name ?? 'N/A',
                    'code' => $this->serial->product->code ?? 'N/A',
                ],
                'branch' => [
                    'name' => $this->serial->branch->branch_name ?? 'N/A',
                ],
            ] : null,
            'damage_type' => [
                'id' => $this->damageType->id ?? null,
                'name' => $this->damageType->name ?? 'N/A',
            ],
            'reason' => [ // Compatibility
                'id' => $this->damageType->id ?? null,
                'name' => $this->damageType->name ?? 'N/A',
            ],
            'quantity' => $this->quantity,
            'width' => $this->width,
            'height' => $this->height,
            'incident_phase' => $this->incident_phase,
            'mistake_staff_names' => $this->mistake_staff_names ?? [],
            'rework_staff_names' => $this->rework_staff_names ?? [],
            'rating' => $this->rating,
            'notes' => $this->notes,
            'qc_report' => [
                'qc_person' => [
                    'full_name' => $this->qcReport->qcPerson->full_name ?? 'System Auto',
                ],
            ],
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }
}
