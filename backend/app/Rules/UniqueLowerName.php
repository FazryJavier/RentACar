<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Case-insensitive uniqueness of `name` (matches the `lower(name)` unique indexes).
 * Mapped to the API error code `not_unique`.
 */
final class UniqueLowerName implements ValidationRule
{
    public function __construct(
        private readonly string $table,
        private readonly string $message,
        private readonly ?int $ignoreId = null,
        private readonly string $column = 'name',
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            return;
        }

        $exists = DB::table($this->table)
            ->whereRaw('lower('.$this->column.') = lower(?)', [$value])
            ->when($this->ignoreId !== null, fn ($query) => $query->where('id', '<>', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail($this->message);
        }
    }
}
