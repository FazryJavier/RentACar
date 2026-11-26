<?php

namespace App\Http\Resources\Admin;

use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Car */
class CarResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'brand' => ['id' => $this->brand->id, 'name' => $this->brand->name],
            'category' => ['id' => $this->category->id, 'name' => $this->category->name],
            'branch' => ['id' => $this->branch->id, 'name' => $this->branch->name],
            'model_name' => $this->model_name,
            'year' => $this->year,
            'plate_number' => $this->plate_number,
            'color' => $this->color,
            'transmission' => $this->transmission->value,
            'fuel_type' => $this->fuel_type->value,
            'seats' => $this->seats,
            'luggage_capacity' => $this->luggage_capacity,
            'daily_price' => $this->daily_price,
            'deposit' => $this->deposit,
            'status' => $this->status->value,
            'description' => $this->description,
            'features' => $this->features ?? [],
            'has_3d' => $this->model3d()->exists(),
            'photos' => CarPhotoResource::collection($this->photos)->resolve($request),
            'version' => $this->version,
            'created_at' => $this->created_at?->toIso8601ZuluString(),
            'updated_at' => $this->updated_at?->toIso8601ZuluString(),
        ];
    }
}
