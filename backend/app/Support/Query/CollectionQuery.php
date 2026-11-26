<?php

namespace App\Support\Query;

use App\Exceptions\ApiValidationException;
use App\Support\Http\ApiError;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Parses page / per_page / sort / q / filter[...] for list endpoints and applies them
 * to an Eloquent query using only what the QuerySpec allows (Spesifikasi API §2.1).
 *
 *   $page = CollectionQuery::fromRequest($request, $spec)->paginate(Car::query());
 *   return ApiResponse::paginated($page, CarResource::collection($page)->resolve());
 */
final readonly class CollectionQuery
{
    public const SEARCH_MIN = 2;

    public const SEARCH_MAX = 100;

    /**
     * @param  array<string, mixed>  $filters
     */
    private function __construct(
        private QuerySpec $spec,
        public int $page,
        public int $perPage,
        public string $sortColumn,
        public string $sortDirection,
        public ?string $search,
        public array $filters,
    ) {}

    /**
     * @throws ApiValidationException when `q` has an invalid length or `filter` has unknown keys
     */
    public static function fromRequest(Request $request, QuerySpec $spec): self
    {
        [$sortColumn, $sortDirection] = self::resolveSort($request->query('sort'), $spec);

        return new self(
            spec: $spec,
            page: self::resolvePage($request->query('page')),
            perPage: self::resolvePerPage($request->query('per_page'), $spec),
            sortColumn: $sortColumn,
            sortDirection: $sortDirection,
            search: self::resolveSearch($request->query('q')),
            filters: self::resolveFilters($request->query('filter'), $spec),
        );
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return LengthAwarePaginator<int, TModel>
     */
    public function paginate(Builder $query): LengthAwarePaginator
    {
        $this->applyFilters($query);
        $this->applySearch($query);

        if ($this->sortColumn !== '') {
            $query->orderBy($this->sortColumn, $this->sortDirection);
        }

        foreach ($this->spec->tieBreakers as $column) {
            if ($column !== $this->sortColumn) {
                $query->orderBy($column);
            }
        }

        return $query->paginate($this->perPage, ['*'], 'page', $this->page);
    }

    private static function resolvePage(mixed $value): int
    {
        $page = filter_var($value, FILTER_VALIDATE_INT);

        return is_int($page) && $page >= 1 ? $page : 1;
    }

    private static function resolvePerPage(mixed $value, QuerySpec $spec): int
    {
        $perPage = filter_var($value, FILTER_VALIDATE_INT);

        return is_int($perPage) && in_array($perPage, $spec->pageSizeOptions(), true)
            ? $perPage
            : $spec->defaultPageSize();
    }

    /**
     * @return array{0: string, 1: 'asc'|'desc'}
     */
    private static function resolveSort(mixed $value, QuerySpec $spec): array
    {
        $requested = is_string($value) ? $value : '';
        $name = ltrim($requested, '-');

        if (! isset($spec->sorts[$name])) {
            $requested = $spec->defaultSort;
            $name = ltrim($requested, '-');
        }

        if ($name === '' || ! isset($spec->sorts[$name])) {
            return ['', 'asc'];
        }

        return [$spec->sorts[$name], str_starts_with($requested, '-') ? 'desc' : 'asc'];
    }

    private static function resolveSearch(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            throw ApiValidationException::single('q', 'invalid_format', 'Kata kunci pencarian tidak valid.');
        }

        $term = trim($value);
        $length = mb_strlen($term);

        if ($length === 0) {
            return null;
        }

        if ($length < self::SEARCH_MIN) {
            throw ApiValidationException::single('q', 'too_short', 'Kata kunci pencarian minimal '.self::SEARCH_MIN.' karakter.');
        }

        if ($length > self::SEARCH_MAX) {
            throw ApiValidationException::single('q', 'too_long', 'Kata kunci pencarian maksimal '.self::SEARCH_MAX.' karakter.');
        }

        return $term;
    }

    /**
     * @return array<string, mixed>
     */
    private static function resolveFilters(mixed $value, QuerySpec $spec): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        if (! is_array($value)) {
            throw ApiValidationException::single('filter', 'invalid_format', 'Format filter tidak valid.');
        }

        $errors = [];

        foreach (array_keys($value) as $key) {
            if (! isset($spec->filters[$key])) {
                $errors[] = new ApiError('filter.'.$key, 'unknown_filter', "Filter '{$key}' tidak dikenal.");
            }
        }

        if ($errors !== []) {
            throw new ApiValidationException($errors);
        }

        /** @var array<string, mixed> $value */
        return $value;
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    private function applyFilters(Builder $query): void
    {
        foreach ($this->filters as $key => $value) {
            $definition = $this->spec->filters[$key];

            if ($definition instanceof Closure) {
                $definition($query, $value);

                continue;
            }

            is_array($value)
                ? $query->whereIn($definition, array_values($value))
                : $query->where($definition, $value);
        }
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    private function applySearch(Builder $query): void
    {
        if ($this->search === null || $this->spec->searchColumns === []) {
            return;
        }

        $pattern = '%'.self::escapeLike($this->search).'%';

        $query->where(function (Builder $inner) use ($pattern): void {
            foreach ($this->spec->searchColumns as $column) {
                $inner->orWhere($column, 'ilike', $pattern);
            }
        });
    }

    /**
     * Escape LIKE wildcards so user input matches literally (PostgreSQL default escape is "\").
     */
    public static function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
