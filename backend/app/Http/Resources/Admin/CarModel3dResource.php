<?php

namespace App\Http\Resources\Admin;

use App\Domain\Fleet\CarModelStore;
use App\Models\CarModel3d;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin CarModel3d */
class CarModel3dResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $disk = Storage::disk(CarModelStore::DISK);
        /** @var array{position?: list<float>, target?: list<float>} $camera */
        $camera = $this->camera ?? [];

        return [
            'url' => $disk->url($this->file_path),
            'poster_url' => $this->poster_path !== null ? $disk->url($this->poster_path) : null,
            'camera' => isset($camera['position'], $camera['target'])
                ? ['position' => $camera['position'], 'target' => $camera['target']]
                : null,
            'file_size' => $this->file_size,
            'source_name' => $this->source_name,
            'source_url' => $this->source_url,
            'license' => $this->license,
            'is_illustrative' => $this->is_illustrative,
            'model_version' => $this->model_version,
            'updated_at' => $this->updated_at?->toIso8601ZuluString(),
        ];
    }
}
