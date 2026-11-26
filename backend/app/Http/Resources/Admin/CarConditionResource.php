<?php

namespace App\Http\Resources\Admin;

use App\Domain\Fleet\ConditionService;
use App\Models\CarCondition;
use App\Models\CarConditionPhoto;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Condition markers as the admin sees them: numbered in creation order and flagged when their
 * position belongs to another (or no) model version.
 */
final class CarConditionResource
{
    /**
     * @param  Collection<int, CarCondition>  $conditions  Every marker of one car.
     * @return list<array<string, mixed>>
     */
    public static function list(Collection $conditions, ?int $modelVersion): array
    {
        return $conditions
            ->sortBy([['created_at', 'asc'], ['id', 'asc']])
            ->values()
            ->map(fn (CarCondition $condition, int $index): array => self::one($condition, $index + 1, $modelVersion))
            ->all();
    }

    /** @return array<string, mixed> */
    public static function one(CarCondition $condition, int $number, ?int $modelVersion): array
    {
        $disk = Storage::disk(ConditionService::DISK);

        return [
            'id' => $condition->id,
            'number' => $number,
            'area' => $condition->area->value,
            'severity' => $condition->severity->value,
            'description' => $condition->description,
            'position' => $condition->position,
            'normal' => $condition->normal,
            'model_version' => $condition->model_version,
            'needs_reposition' => $condition->position !== null && $condition->model_version !== $modelVersion,
            'inspected_on' => $condition->inspected_on->toDateString(),
            'is_resolved' => $condition->is_resolved,
            'resolved_at' => $condition->resolved_at?->toIso8601ZuluString(),
            'photos' => $condition->photos->map(fn (CarConditionPhoto $photo): array => [
                'id' => $photo->id,
                'url' => $disk->url($photo->path),
            ])->values()->all(),
        ];
    }
}
