<?php

namespace App\Jobs;

use App\Domain\Fleet\CarPhotoStore;
use App\Models\CarPhoto;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Throwable;

/**
 * Turns an uploaded original into public WebP variants (480/960/1440 px wide, never upscaled).
 * Re-encoding with GD writes no EXIF/XMP/IPTC, so metadata such as GPS location is removed.
 */
final class ProcessCarPhoto implements ShouldQueue
{
    use Queueable;

    /** Variant widths, largest first (each step scales the previous result down). */
    public const WIDTHS = [1440, 960, 480];

    public const QUALITY = 80;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30];

    public function __construct(public readonly int $photoId) {}

    public function handle(): void
    {
        $photo = CarPhoto::query()->find($this->photoId);
        if ($photo === null || $photo->isProcessed()) {
            return;
        }

        $original = Storage::disk(CarPhotoStore::ORIGINALS_DISK);
        $public = Storage::disk(CarPhotoStore::PUBLIC_DISK);
        $written = [];

        // A 6000 × 6000 px image needs ~150 MB as a GD bitmap.
        ini_set('memory_limit', '512M');

        try {
            $image = ImageManager::gd(autoOrientation: true, decodeAnimation: false)->read((string) $original->get($photo->path));
            $base = "cars/{$photo->car_id}/".Str::uuid()->toString();
            $variants = [];

            foreach (self::WIDTHS as $width) {
                $image->scaleDown(width: $width);
                $path = "{$base}-{$width}.webp";
                $public->put($path, (string) $image->toWebp(quality: self::QUALITY));
                $written[] = $path;
                $variants[(string) $width] = $path;
            }
        } catch (Throwable $exception) {
            $public->delete($written);

            throw $exception;
        }

        $saved = DB::transaction(function () use ($photo, $variants): bool {
            $locked = CarPhoto::query()->whereKey($photo->id)->lockForUpdate()->first();
            if ($locked === null) {
                return false;
            }

            $locked->forceFill([
                'variants' => array_reverse($variants, true),
                'path' => $variants['1440'],
                'processed_at' => now(),
            ])->save();

            return true;
        });

        if (! $saved) {
            // The photo was deleted while it was being processed.
            $public->delete($written);
        }

        $original->delete($photo->path);
    }

    public function failed(?Throwable $exception): void
    {
        $photo = CarPhoto::query()->find($this->photoId);
        if ($photo === null || $photo->isProcessed()) {
            return;
        }

        Storage::disk(CarPhotoStore::ORIGINALS_DISK)->delete($photo->path);
        $photo->delete();

        Log::warning('Car photo could not be processed and was removed.', [
            'photo_id' => $this->photoId,
            'car_id' => $photo->car_id,
            'error' => $exception?->getMessage(),
        ]);
    }
}
