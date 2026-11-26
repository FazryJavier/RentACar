<?php

namespace App\Jobs;

use App\Domain\Fleet\CarPhotoStore;
use App\Domain\Media\ImageReencoder;
use App\Models\CarPhoto;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30];

    public function __construct(public readonly int $photoId) {}

    public function handle(ImageReencoder $reencoder): void
    {
        $photo = CarPhoto::query()->find($this->photoId);
        if ($photo === null || $photo->isProcessed()) {
            return;
        }

        $original = Storage::disk(CarPhotoStore::ORIGINALS_DISK);
        $public = Storage::disk(CarPhotoStore::PUBLIC_DISK);
        $written = [];

        try {
            $encoded = $reencoder->variants((string) $original->get($photo->path), self::WIDTHS);
            $base = "cars/{$photo->car_id}/".Str::uuid()->toString();
            $variants = [];

            foreach ($encoded as $width => $bytes) {
                $path = "{$base}-{$width}.webp";
                $public->put($path, $bytes);
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
