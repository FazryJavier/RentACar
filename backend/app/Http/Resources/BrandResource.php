<?php

namespace App\Http\Resources;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @property-read Brand $resource */
class BrandResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $brand = $this->resource;

        return [
            'id' => $brand->id,
            'name' => $brand->name,
            'slug' => $brand->slug,
            'logo_url' => $brand->logo_path !== null ? Storage::disk('public')->url($brand->logo_path) : null,
            'version' => $brand->version,
            'created_at' => $brand->created_at?->utc()->toIso8601ZuluString(),
            'updated_at' => $brand->updated_at?->utc()->toIso8601ZuluString(),
        ];
    }
}
