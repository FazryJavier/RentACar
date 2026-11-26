<?php

namespace App\Http\Resources;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read Branch $resource */
class BranchResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $branch = $this->resource;

        return [
            'id' => $branch->id,
            'name' => $branch->name,
            'slug' => $branch->slug,
            'address' => $branch->address,
            'city' => $branch->city,
            'phone' => $branch->phone,
            'opening_time' => substr((string) $branch->opening_time, 0, 5),
            'closing_time' => substr((string) $branch->closing_time, 0, 5),
            'latitude' => (string) $branch->latitude,
            'longitude' => (string) $branch->longitude,
            'is_active' => $branch->is_active,
            'version' => $branch->version,
            'created_at' => $branch->created_at?->utc()->toIso8601ZuluString(),
            'updated_at' => $branch->updated_at?->utc()->toIso8601ZuluString(),
        ];
    }
}
