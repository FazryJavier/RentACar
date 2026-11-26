<?php

namespace App\Http\Resources\Admin;

use App\Domain\Fleet\CarPhotoStore;
use App\Models\CarPhoto;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin CarPhoto */
class CarPhotoResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sort_order' => $this->sort_order,
            'is_main' => $this->sort_order === 0,
            'alt_text' => $this->alt_text,
            'processing' => ! $this->isProcessed(),
            // An object, so JSON keeps the width keys (resources re-index numeric-keyed arrays).
            'urls' => ($urls = self::urls($this->resource)) === null ? null : (object) $urls,
        ];
    }

    /** @return array<int, string>|null Public URLs keyed by width (480, 960, 1440), or null while processing. */
    public static function urls(CarPhoto $photo): ?array
    {
        if (! $photo->isProcessed()) {
            return null;
        }

        $disk = Storage::disk(CarPhotoStore::PUBLIC_DISK);
        $urls = [];
        foreach ((array) $photo->variants as $width => $path) {
            $urls[(int) $width] = $disk->url((string) $path);
        }

        return $urls;
    }
}
