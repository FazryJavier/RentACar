<?php

namespace App\Enums\Concerns;

/**
 * Helpers shared by string-backed enums.
 */
trait HasValues
{
    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }

    /**
     * SQL list for CHECK constraints, e.g. 'a', 'b', 'c'.
     */
    public static function sqlList(): string
    {
        return implode(', ', array_map(static fn (string $v): string => "'".str_replace("'", "''", $v)."'", self::values()));
    }
}
