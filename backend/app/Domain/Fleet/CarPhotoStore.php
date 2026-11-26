<?php

namespace App\Domain\Fleet;

use App\Exceptions\ApiValidationException;
use App\Jobs\ProcessCarPhoto;
use App\Models\Car;
use App\Models\CarPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Car photos: at most five per car, originals kept privately until the queued job has written
 * the public WebP variants, ordered by `sort_order` (0 = main photo).
 */
final class CarPhotoStore
{
    public const MAX_PHOTOS = 5;

    /** Private disk for originals (may contain EXIF/GPS metadata). */
    public const ORIGINALS_DISK = 'local';

    public const ORIGINALS_DIR = 'car-photos/originals';

    /** Public disk for the processed WebP variants. */
    public const PUBLIC_DISK = 'public';

    private const EXTENSIONS = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    public function add(Car $car, UploadedFile $file, ?string $altText): CarPhoto
    {
        $extension = self::EXTENSIONS[(string) $file->getMimeType()] ?? 'img';

        return DB::transaction(function () use ($car, $file, $altText, $extension): CarPhoto {
            // Lock the car so parallel uploads cannot exceed the limit.
            Car::query()->whereKey($car->id)->lockForUpdate()->firstOrFail();
            $count = CarPhoto::query()->where('car_id', $car->id)->count();

            if ($count >= self::MAX_PHOTOS) {
                throw ApiValidationException::single('photo', 'too_many', 'Maksimal '.self::MAX_PHOTOS.' foto per mobil.');
            }

            $path = $file->storeAs(self::ORIGINALS_DIR, Str::uuid()->toString().'.'.$extension, self::ORIGINALS_DISK);
            if ($path === false) {
                throw new \RuntimeException('The photo could not be stored.');
            }

            $photo = CarPhoto::query()->create([
                'car_id' => $car->id,
                'path' => $path,
                'variants' => [],
                'alt_text' => $altText !== null && trim($altText) !== '' ? trim($altText) : $this->defaultAltText($car, $count + 1),
                'sort_order' => $count,
                'processed_at' => null,
            ]);

            ProcessCarPhoto::dispatch($photo->id)->afterCommit();

            return $photo;
        });
    }

    /**
     * @param  list<int>  $photoIds  Every photo of the car, in the new order.
     */
    public function reorder(Car $car, array $photoIds): void
    {
        DB::transaction(function () use ($car, $photoIds): void {
            Car::query()->whereKey($car->id)->lockForUpdate()->firstOrFail();
            $current = CarPhoto::query()->where('car_id', $car->id)->pluck('id')->map(fn ($id): int => (int) $id)->all();

            $requested = array_map('intval', $photoIds);
            $sortedRequested = $requested;
            sort($sortedRequested);
            sort($current);

            if (count(array_unique($requested)) !== count($requested) || $sortedRequested !== $current) {
                throw ApiValidationException::single('photo_ids', 'mismatch', 'Urutan harus berisi semua foto mobil ini, masing-masing sekali.');
            }

            foreach ($requested as $position => $id) {
                CarPhoto::query()->whereKey($id)->update(['sort_order' => $position]);
            }
        });
    }

    public function delete(Car $car, CarPhoto $photo): void
    {
        $files = $this->files($photo);

        DB::transaction(function () use ($car, $photo): void {
            Car::query()->whereKey($car->id)->lockForUpdate()->firstOrFail();
            $photo->delete();

            CarPhoto::query()->where('car_id', $car->id)->orderBy('sort_order')->orderBy('id')->get()
                ->each(fn (CarPhoto $remaining, int $position) => $remaining->sort_order === $position
                    ? null
                    : $remaining->forceFill(['sort_order' => $position])->save());
        });

        foreach ($files as $disk => $paths) {
            Storage::disk($disk)->delete($paths);
        }
    }

    /**
     * Files that belong to a photo, grouped by disk.
     *
     * @return array<string, list<string>>
     */
    public function files(CarPhoto $photo): array
    {
        if (! $photo->isProcessed()) {
            return [self::ORIGINALS_DISK => [$photo->path]];
        }

        /** @var array<string, string> $variants */
        $variants = $photo->variants;

        return [self::PUBLIC_DISK => array_values(array_unique([...array_values($variants), $photo->path]))];
    }

    private function defaultAltText(Car $car, int $number): string
    {
        $car->loadMissing('brand');

        return Str::limit("{$car->brand->name} {$car->model_name} {$car->year} {$car->color} — foto {$number}", 160, '');
    }
}
