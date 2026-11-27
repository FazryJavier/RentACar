<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Booking\AvailabilityQuery;
use App\Domain\Booking\PriceCalculator;
use App\Domain\Booking\PriceToken;
use App\Domain\Booking\RentalWindow;
use App\Domain\Booking\RentalWindowValidator;
use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Exceptions\ApiValidationException;
use App\Http\Controllers\Controller;
use App\Http\Resources\Public\PublicCarPresenter;
use App\Models\Branch;
use App\Models\Car;
use App\Support\ApiResponse;
use App\Support\Query\CollectionQuery;
use App\Support\Query\QuerySpec;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PublicCarController extends Controller
{
    use PublicCache;

    private const SIMILAR_LIMIT = 4;

    private const SLUG = '/^[a-z0-9][a-z0-9-]{0,159}$/';

    public function __construct(
        private readonly RentalWindowValidator $windows,
        private readonly AvailabilityQuery $availability,
        private readonly PriceCalculator $prices,
        private readonly PriceToken $tokens,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $branch = $this->branch($request);
        $window = $this->window($request, $branch);
        $this->checkPriceRange($request);

        // "popular" means most-booked first; the query layer reads a leading "-" as descending.
        if ($request->query('sort') === 'popular') {
            $request->query->set('sort', '-popular');
        }

        $spec = new QuerySpec(
            audience: QuerySpec::AUDIENCE_PUBLIC,
            sorts: ['popular' => 'cars.completed_bookings_count', 'price' => 'cars.daily_price', 'newest' => 'cars.created_at'],
            defaultSort: '-popular',
            filters: $this->filters(),
            tieBreakers: ['cars.id'],
        );

        $query = $this->publicCars();
        if ($window !== null && $branch !== null) {
            $this->availability->apply($query, $branch, $window);
        } elseif ($branch !== null) {
            $query->where('cars.branch_id', $branch->id);
        }

        $page = CollectionQuery::fromRequest($request, $spec)->paginate($query);
        $items = array_map(
            fn (Car $car): array => PublicCarPresenter::card($car, $window !== null ? $this->prices->for($car, $window) : null),
            $page->items(),
        );
        $response = ApiResponse::paginated($page, $items);

        return $window === null ? $this->cacheable($response) : $response;
    }

    public function show(string $slug): JsonResponse
    {
        $car = $this->publicCars()->with(['conditions.photos', 'model3d'])->where('cars.slug', $slug)->firstOrFail();

        return $this->cacheable(ApiResponse::ok(PublicCarPresenter::detail($car)));
    }

    public function availability(Request $request, string $slug): JsonResponse
    {
        $car = $this->publicCars()->where('cars.slug', $slug)->firstOrFail();
        $branch = $this->branch($request);
        $window = $this->windows->validate($request->only(['pickup_at', 'return_at']), $branch);
        assert($branch !== null);

        $reason = $this->availability->reason($car, $branch, $window);
        $price = $this->prices->for($car, $window);

        return ApiResponse::ok([
            'available' => $reason === null,
            'reason' => $reason,
            'price' => $price->toArray(),
            'price_token' => $this->tokens->issue($car, $branch, $window, $price),
        ]);
    }

    public function similar(Request $request, string $slug): JsonResponse
    {
        $car = $this->publicCars()->where('cars.slug', $slug)->firstOrFail();
        $branch = $this->branch($request);
        $window = $this->window($request, $branch);

        $query = $this->publicCars()
            ->where('cars.category_id', $car->category_id)
            ->whereKeyNot($car->id)
            ->orderByRaw('abs(cars.daily_price - ?) asc', [$car->daily_price])
            ->orderBy('cars.id')
            ->limit(self::SIMILAR_LIMIT);
        if ($window !== null && $branch !== null) {
            $this->availability->apply($query, $branch, $window);
        }

        $items = $query->get()->map(
            fn (Car $similar): array => PublicCarPresenter::card($similar, $window !== null ? $this->prices->for($similar, $window) : null),
        )->all();
        $response = ApiResponse::ok($items);

        return $window === null ? $this->cacheable($response) : $response;
    }

    /** @return Builder<Car> */
    private function publicCars(): Builder
    {
        return Car::query()
            ->select('cars.*')
            ->where('cars.status', CarStatus::Active->value)
            ->with(['brand', 'category', 'branch', 'photos'])
            ->withExists('model3d as has_3d');
    }

    private function branch(Request $request): ?Branch
    {
        $slug = $request->query('branch');
        if ($slug === null || $slug === '') {
            return null;
        }

        $branch = is_string($slug) && preg_match(self::SLUG, $slug) === 1
            ? Branch::query()->where('slug', $slug)->where('is_active', true)->first()
            : null;

        if ($branch === null) {
            throw ApiValidationException::single('branch', 'invalid', 'Cabang tidak ditemukan');
        }

        return $branch;
    }

    /** The validated window when dates are given, otherwise null (plain catalog). */
    private function window(Request $request, ?Branch $branch): ?RentalWindow
    {
        if (! $request->filled('pickup_at') && ! $request->filled('return_at')) {
            return null;
        }

        return $this->windows->validate($request->only(['pickup_at', 'return_at']), $branch);
    }

    private function checkPriceRange(Request $request): void
    {
        $filter = $request->query('filter');
        if (! is_array($filter) || ! isset($filter['price_min'], $filter['price_max'])) {
            return;
        }
        if (is_numeric($filter['price_min']) && is_numeric($filter['price_max']) && (int) $filter['price_min'] > (int) $filter['price_max']) {
            throw ApiValidationException::single('filter.price_min', 'out_of_range', 'Harga minimum tidak boleh lebih besar dari harga maksimum');
        }
    }

    /** @return array<string, \Closure> */
    private function filters(): array
    {
        return [
            'category' => fn (Builder $query, mixed $value) => $query->whereHas(
                'category',
                fn (Builder $category) => $category->whereIn('slug', $this->slugs('category', $value)),
            ),
            'brand' => fn (Builder $query, mixed $value) => $query->whereHas(
                'brand',
                fn (Builder $brand) => $brand->whereIn('slug', $this->slugs('brand', $value)),
            ),
            'transmission' => fn (Builder $query, mixed $value) => $query->where(
                'cars.transmission',
                $this->enumValue('transmission', $value, Transmission::class),
            ),
            'fuel_type' => fn (Builder $query, mixed $value) => $query->whereIn(
                'cars.fuel_type',
                array_map(fn (string $item): string => $this->enumValue('fuel_type', $item, FuelType::class), $this->list($value)),
            ),
            'seats_min' => fn (Builder $query, mixed $value) => $query->where('cars.seats', '>=', $this->integer('seats_min', $value, 2, 16)),
            'price_min' => fn (Builder $query, mixed $value) => $query->where('cars.daily_price', '>=', $this->integer('price_min', $value, 0, PHP_INT_MAX)),
            'price_max' => fn (Builder $query, mixed $value) => $query->where('cars.daily_price', '<=', $this->integer('price_max', $value, 0, PHP_INT_MAX)),
        ];
    }

    /** @return list<string> */
    private function list(mixed $value): array
    {
        $items = is_array($value) ? $value : explode(',', is_string($value) ? $value : '');

        return array_values(array_filter(array_map(static fn (mixed $item): string => is_string($item) ? trim($item) : '', $items), static fn (string $item): bool => $item !== ''));
    }

    /** @return list<string> */
    private function slugs(string $key, mixed $value): array
    {
        $slugs = $this->list($value);
        if ($slugs === [] || count($slugs) > 20) {
            throw ApiValidationException::single("filter.{$key}", 'invalid_format', 'Filter tidak valid');
        }
        foreach ($slugs as $slug) {
            if (preg_match(self::SLUG, $slug) !== 1) {
                throw ApiValidationException::single("filter.{$key}", 'invalid_format', 'Filter tidak valid');
            }
        }

        return $slugs;
    }

    /**
     * @param  class-string<\BackedEnum>  $enum
     */
    private function enumValue(string $key, mixed $value, string $enum): string
    {
        if (! is_string($value) || $enum::tryFrom($value) === null) {
            throw ApiValidationException::single("filter.{$key}", 'invalid_format', 'Filter tidak valid');
        }

        return $value;
    }

    private function integer(string $key, mixed $value, int $min, int $max): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if (! is_int($number) || $number < $min || $number > $max) {
            throw ApiValidationException::single("filter.{$key}", 'out_of_range', 'Filter tidak valid');
        }

        return $number;
    }
}
