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
     */
    public function unique(string $model, string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $base = $base === '' ? 'item' : $base;

        $taken = $model::query()
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
