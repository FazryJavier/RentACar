<?php

namespace App\Domain\Fleet;

use App\Domain\Media\ImageReencoder;
use App\Exceptions\ApiValidationException;
use App\Models\Admin;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarConditionPhoto;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Condition markers. A marker on a car with a 3D model needs a position and stores the model
 * version it was placed on; without a model it has no position (area only).
 */
final class ConditionService
{
    public const MAX_PHOTOS = 3;

    public const PHOTO_WIDTH = 1280;

    public const DISK = 'public';

    public const POSITION_REQUIRED = 'Klik titik pada model';

    public function __construct(private readonly ImageReencoder $images) {}

    /**
     * @param  array<string, mixed>  $values  area, severity, description, inspected_on, position?, normal?
     */
    public function create(Car $car, Admin $admin, array $values): CarCondition
    {
        $modelVersion = $car->model3d()->value('model_version');

        if ($modelVersion !== null && ! isset($values['position'], $values['normal'])) {
            throw ApiValidationException::single('position', 'required', self::POSITION_REQUIRED);
        }
        if ($modelVersion === null && (isset($values['position']) || isset($values['normal']))) {
            throw ApiValidationException::single('position', 'invalid', 'Mobil belum punya model 3D; pilih area saja.');
        }

        return CarCondition::query()->create([
            ...$values,
            'car_id' => $car->id,
            'model_version' => $modelVersion,
            'position' => $modelVersion !== null ? $values['position'] : null,
            'normal' => $modelVersion !== null ? $values['normal'] : null,
            'created_by_admin_id' => $admin->id,
        ])->refresh();
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array{0: CarCondition, 1: array<string, array{0: mixed, 1: mixed}>}
     */
    public function update(Car $car, CarCondition $condition, array $values): array
    {
        if (array_key_exists('position', $values) || array_key_exists('normal', $values)) {
            $modelVersion = $car->model3d()->value('model_version');
            if ($modelVersion === null) {
                throw ApiValidationException::single('position', 'invalid', 'Mobil belum punya model 3D; pilih area saja.');
            }
            if (! isset($values['position'], $values['normal'])) {
                throw ApiValidationException::single('position', 'required', self::POSITION_REQUIRED);
            }
            $values['model_version'] = $modelVersion;
        }

        if (array_key_exists('is_resolved', $values)) {
            $resolved = (bool) $values['is_resolved'];
            if ($resolved !== $condition->is_resolved) {
                $values['resolved_at'] = $resolved ? now() : null;
            }
        }

        $condition->fill($values);
        $changes = [];
        foreach (array_keys($condition->getDirty()) as $field) {
            $changes[$field] = [$condition->getOriginal($field), $condition->getAttribute($field)];
        }
        $condition->save();

        return [$condition->refresh(), $this->auditable($changes)];
    }

    public function delete(CarCondition $condition): void
    {
        $files = $condition->photos()->pluck('path')->all();
        $condition->delete();
        Storage::disk(self::DISK)->delete($files);
    }

    public function addPhoto(CarCondition $condition, UploadedFile $file): CarConditionPhoto
    {
        $webp = $this->images->webp((string) file_get_contents((string) $file->getRealPath()), self::PHOTO_WIDTH);
        $path = "cars/{$condition->car_id}/conditions/".Str::uuid()->toString().'.webp';
        $disk = Storage::disk(self::DISK);

        try {
            return DB::transaction(function () use ($condition, $path, $webp, $disk): CarConditionPhoto {
                CarCondition::query()->whereKey($condition->id)->lockForUpdate()->firstOrFail();
                $count = CarConditionPhoto::query()->where('car_condition_id', $condition->id)->count();
                if ($count >= self::MAX_PHOTOS) {
                    throw ApiValidationException::single('photo', 'too_many', 'Maksimal '.self::MAX_PHOTOS.' foto per penanda.');
                }

                $disk->put($path, $webp);

                return CarConditionPhoto::query()->create([
                    'car_condition_id' => $condition->id,
                    'path' => $path,
                    'sort_order' => $count,
                ]);
            });
        } catch (\Throwable $exception) {
            $disk->delete($path);

            throw $exception;
        }
    }

    public function deletePhoto(CarConditionPhoto $photo): void
    {
        $photo->delete();
        Storage::disk(self::DISK)->delete($photo->path);
    }

    /**
     * Enum and date values as plain strings so audit rows stay readable JSON.
     *
     * @param  array<string, array{0: mixed, 1: mixed}>  $changes
     * @return array<string, array{0: mixed, 1: mixed}>
     */
    private function auditable(array $changes): array
    {
        return array_map(fn (array $pair): array => array_map(
            fn (mixed $value): mixed => match (true) {
                $value instanceof \BackedEnum => $value->value,
                $value instanceof \DateTimeInterface => $value->format(DATE_ATOM),
                default => $value,
            },
            $pair,
        ), $changes);
    }
}
