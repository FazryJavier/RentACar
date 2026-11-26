<?php

namespace App\Domain\Admin\MasterData;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Applies an update only if the stored version still matches what the admin loaded,
 * in one conditional UPDATE (no race window), and increments the version.
 */
final class VersionedUpdate
{
    /**
     * @template TModel of Model
     *
     * @param  TModel  $model
     * @param  array<string, mixed>  $values
     * @return array{0: TModel, 1: array<string, array{0: mixed, 1: mixed}>} The refreshed model and the changes [old, new].
     *
     * @throws VersionConflict
     */
    public function apply(Model $model, array $values, int $expectedVersion): array
    {
        $probe = (clone $model)->fill($values);
        $dirty = $probe->getDirty();

        $changes = [];
        foreach (array_keys($dirty) as $field) {
            $changes[$field] = [$model->getOriginal($field), $probe->getAttribute($field)];
        }

        $affected = $model->newQuery()
            ->whereKey($model->getKey())
            ->where('version', $expectedVersion)
            ->update([
                ...array_intersect_key($probe->getAttributes(), $dirty),
                'version' => DB::raw('version + 1'),
                $model->getUpdatedAtColumn() => $model->freshTimestampString(),
            ]);

        if ($affected === 0) {
            throw new VersionConflict;
        }

        return [$model->refresh(), $changes];
    }
}
