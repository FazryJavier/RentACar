<?php

namespace App\Http\Resources\Admin;

use App\Models\Car;
use App\Models\CarPhoto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Car */
class CarListResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $main = $this->photos->first(fn (CarPhoto $photo): bool => $photo->isProcessed());
        $mainUrls = $main !== null ? CarPhotoResource::urls($main) : null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'model_name' => $this->model_name,
            'year' => $this->year,
            'plate_number' => $this->plate_number,
            'color' => $this->color,
            'status' => $this->status->value,
            'daily_price' => $this->daily_price,
            'brand' => ['id' => $this->brand->id, 'name' => $this->brand->name],
            'category' => ['id' => $this->category->id, 'name' => $this->category->name],
            'branch' => ['id' => $this->branch->id, 'name' => $this->branch->name],
            'thumbnail_url' => $mainUrls[480] ?? null,
            'photos_count' => $this->photos->count(),
            'has_3d' => (bool) $this->getAttribute('has_3d'),
        ];
    }
}
