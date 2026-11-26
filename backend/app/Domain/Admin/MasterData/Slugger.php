<?php

namespace App\Domain\Admin\MasterData;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Unique, lowercase, hyphenated slugs: "Mewah" → mewah, a second "Mewah!" → mewah-2.
 */
final class Slugger
{
    /**
     * @param  class-string<Model>  $model
     * @param  bool  $includeTrashed  Also treat slugs of soft-deleted rows as taken.
     */
    public function unique(string $model, string $name, ?int $ignoreId = null, bool $includeTrashed = false): string
    {
        $base = Str::slug($name);
        $base = $base === '' ? 'item' : $base;

        // Soft-deleted rows keep their slug (unique index), so callers with soft deletes pass $includeTrashed.
        $taken = ($includeTrashed ? $model::query()->withoutGlobalScopes() : $model::query())
            ->where(fn ($query) => $query->where('slug', $base)->orWhere('slug', 'like', $base.'-%'))
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->pluck('slug')
            ->all();

        if (! in_array($base, $taken, true)) {
            return $base;
        }

        $suffix = 2;
        while (in_array("{$base}-{$suffix}", $taken, true)) {
            $suffix++;
        }

        return "{$base}-{$suffix}";
    }
}
