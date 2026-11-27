<?php

namespace App\Http\Resources\Public;

use App\Domain\Booking\PriceBreakdown;
use App\Enums\ConditionSeverity;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarPhoto;
use Illuminate\Support\Facades\Storage;

/**
 * Public car data, built field by field so internal data (IDs, plate number, versions, GPS,
 * resolved markers) can never leak into public responses.
 */
final class PublicCarPresenter
{
    /** @return array<string, mixed> */
    public static function card(Car $car, ?PriceBreakdown $price = null): array
    {
        $photo = $car->photos->first(fn (CarPhoto $photo): bool => $photo->isProcessed());

        return [
            'slug' => $car->slug,
            'name' => "{$car->brand->name} {$car->model_name} {$car->year}",
            'brand' => ['slug' => $car->brand->slug, 'name' => $car->brand->name],
            'category' => ['slug' => $car->category->slug, 'name' => $car->category->name],
            'branch' => ['slug' => $car->branch->slug, 'name' => $car->branch->name, 'city' => $car->branch->city],
            'transmission' => $car->transmission->value,
            'fuel_type' => $car->fuel_type->value,
            'seats' => $car->seats,
            'daily_price' => $car->daily_price,
            'thumbnail' => $photo !== null ? self::image($photo, '960') : null,
            'has_3d' => (bool) ($car->getAttribute('has_3d') ?? $car->model3d !== null),
            'estimate' => $price?->estimate(),
        ];
    }

    /** @return array<string, mixed> */
    public static function detail(Car $car, ?PriceBreakdown $price = null): array
    {
        $model = $car->model3d;
        $disk = Storage::disk('public');
        $active = $car->conditions
            ->where('is_resolved', false)
            ->sortBy([['created_at', 'asc'], ['id', 'asc']])
            ->values();

        return [
            ...self::card($car, $price),
            'year' => $car->year,
            'color' => $car->color,
            'luggage_capacity' => $car->luggage_capacity,
            'description' => $car->description,
            'features' => $car->features ?? [],
            'deposit' => $car->deposit,
            'photos' => $car->photos
                ->filter(fn (CarPhoto $photo): bool => $photo->isProcessed())
                ->values()
                ->map(fn (CarPhoto $photo): array => self::image($photo, '1440'))
                ->all(),
            'model_3d' => $model === null ? null : [
                'url' => $disk->url($model->file_path),
                'poster_url' => $model->poster_path !== null ? $disk->url($model->poster_path) : null,
                'camera' => isset($model->camera['position'], $model->camera['target'])
                    ? ['position' => $model->camera['position'], 'target' => $model->camera['target']]
                    : null,
                'is_illustrative' => $model->is_illustrative,
                'credit' => [
                    'source_name' => $model->source_name,
                    'source_url' => $model->source_url,
                    'license' => $model->license,
                ],
            ],
            'conditions' => $active->map(function (CarCondition $condition, int $index) use ($model, $disk): array {
                $needsReposition = $condition->position !== null && $condition->model_version !== $model?->model_version;

                return [
                    'number' => $index + 1,
                    'area' => $condition->area->value,
                    'severity' => $condition->severity->value,
                    'description' => $condition->description,
                    'position' => $needsReposition ? null : $condition->position,
                    'normal' => $needsReposition ? null : $condition->normal,
                    'needs_reposition' => $needsReposition,
                    'photos' => $condition->photos->map(fn ($photo): array => ['url' => $disk->url($photo->path)])->values()->all(),
                    'inspected_on' => $condition->inspected_on->toDateString(),
                ];
            })->all(),
            'inspection_summary' => [
                'last_inspected_at' => $car->last_inspected_at?->toIso8601ZuluString(),
                'active_conditions' => [
                    'minor' => $active->where('severity', ConditionSeverity::Minor)->count(),
                    'moderate' => $active->where('severity', ConditionSeverity::Moderate)->count(),
                    'major' => $active->where('severity', ConditionSeverity::Major)->count(),
                ],
                'odometer_km' => $car->odometer_km,
            ],
        ];
    }

    /** @return array{url: string, srcset: string, alt: string} */
    private static function image(CarPhoto $photo, string $preferred): array
    {
        $disk = Storage::disk('public');
        /** @var array<string, string> $variants */
        $variants = $photo->variants;
        $srcset = [];
        foreach ($variants as $width => $path) {
            $srcset[] = $disk->url($path)." {$width}w";
        }

        return [
            'url' => $disk->url($variants[$preferred] ?? $photo->path),
            'srcset' => implode(', ', $srcset),
            'alt' => $photo->alt_text,
        ];
    }
}
