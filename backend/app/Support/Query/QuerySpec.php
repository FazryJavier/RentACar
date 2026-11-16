<?php

namespace App\Support\Query;

use Closure;
use InvalidArgumentException;

/**
 * Declares what a list endpoint allows: audience (page sizes), sortable fields,
 * default sort, searchable columns and filter keys. Anything not declared is rejected
 * or ignored, so raw input never reaches SQL identifiers.
 */
final readonly class QuerySpec
{
    public const AUDIENCE_PUBLIC = 'public';

    public const AUDIENCE_ADMIN = 'admin';

    /** @var array<string, array{options: list<int>, default: int}> */
    public const PAGE_SIZES = [
        self::AUDIENCE_PUBLIC => ['options' => [12, 24, 48], 'default' => 12],
        self::AUDIENCE_ADMIN => ['options' => [10, 25, 50, 100], 'default' => 25],
    ];

    /**
     * @param  array<string, string>  $sorts  Public sort name => database column.
     * @param  string  $defaultSort  A key of $sorts, optionally prefixed with "-".
     * @param  list<string>  $searchColumns  Columns matched case-insensitively by `q`.
     * @param  array<string, string|Closure>  $filters  Filter key => column, or callback `fn (Builder $query, mixed $value): void`.
     */
    public function __construct(
        public string $audience = self::AUDIENCE_PUBLIC,
        public array $sorts = [],
        public string $defaultSort = '',
        public array $searchColumns = [],
        public array $filters = [],
    ) {
        if (! isset(self::PAGE_SIZES[$audience])) {
            throw new InvalidArgumentException("Unknown audience [{$audience}].");
        }

        if ($defaultSort !== '' && ! isset($sorts[ltrim($defaultSort, '-')])) {
            throw new InvalidArgumentException("Default sort [{$defaultSort}] is not an allowed sort.");
        }
    }

    /**
     * @return list<int>
     */
    public function pageSizeOptions(): array
    {
        return self::PAGE_SIZES[$this->audience]['options'];
    }

    public function defaultPageSize(): int
    {
        return self::PAGE_SIZES[$this->audience]['default'];
    }
}
