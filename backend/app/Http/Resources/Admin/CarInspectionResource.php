<?php

namespace App\Http\Resources\Admin;

use App\Models\CarInspection;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CarInspection */
class CarInspectionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'inspected_at' => $this->inspected_at->toIso8601ZuluString(),
            'odometer_km' => $this->odometer_km,
            'notes' => $this->notes,
            'admin' => $this->admin !== null ? ['id' => $this->admin->id, 'name' => $this->admin->name] : null,
        ];
    }
}
