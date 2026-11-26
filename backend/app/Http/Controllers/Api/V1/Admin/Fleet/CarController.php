<?php

namespace App\Http\Controllers\Api\V1\Admin\Fleet;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Admin\MasterData\Slugger;
use App\Domain\Fleet\CarUpdater;
use App\Http\Controllers\Api\V1\Admin\MasterData\AdminController;
use App\Http\Requests\Admin\Fleet\CarRequest;
use App\Http\Resources\Admin\CarListResource;
use App\Http\Resources\Admin\CarResource;
use App\Models\Brand;
use App\Models\Car;
use App\Support\ApiResponse;
use App\Support\Query\CollectionQuery;
use App\Support\Query\QuerySpec;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CarController extends AdminController
{
    private const RELATIONS = ['brand', 'category', 'branch', 'photos', 'model3d'];

    public function __construct(
        private readonly Slugger $slugger,
        private readonly CarUpdater $updater,
        private readonly MasterDataAudit $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $admin = $this->admin($request);

        $spec = new QuerySpec(
            audience: QuerySpec::AUDIENCE_ADMIN,
            sorts: [
                'model_name' => 'cars.model_name',
                'year' => 'cars.year',
                'daily_price' => 'cars.daily_price',
                'created_at' => 'cars.created_at',
            ],
            defaultSort: '-created_at',
            searchColumns: ['cars.model_name', 'cars.plate_number', 'brands.name'],
            filters: [
                'status' => 'cars.status',
                'category_id' => 'cars.category_id',
                'brand_id' => 'cars.brand_id',
                // Staf lists are already limited to their branch; their branch filter is ignored.
                'branch_id' => function (Builder $query, mixed $value) use ($admin): void {
                    if ($admin->isSuperAdmin()) {
                        is_array($value)
                            ? $query->whereIn('cars.branch_id', array_values($value))
                            : $query->where('cars.branch_id', $value);
                    }
                },
            ],
            tieBreakers: ['cars.id'],
        );

        $query = Car::query()
            ->visibleTo($admin)
            ->join('brands', 'brands.id', '=', 'cars.brand_id')
            ->select('cars.*')
            ->with(self::RELATIONS)
            ->withExists('model3d as has_3d');

        $page = CollectionQuery::fromRequest($request, $spec)->paginate($query);

        return ApiResponse::paginated($page, CarListResource::collection($page->items())->resolve($request));
    }

    public function show(Request $request, int $car): JsonResponse
    {
        $model = Car::findVisibleOrFail($car, $this->admin($request))->load(self::RELATIONS);

        return ApiResponse::ok(CarResource::make($model)->resolve($request));
    }

    public function store(CarRequest $request): JsonResponse
    {
        $values = $request->carValues();
        $brand = Brand::query()->findOrFail($values['brand_id']);

        $car = $this->guardUniquePlate(fn () => DB::transaction(fn () => Car::query()->create([
            ...$values,
            'slug' => $this->slugger->unique(
                Car::class,
                "{$brand->name} {$values['model_name']} {$values['year']} {$values['color']}",
                includeTrashed: true,
            ),
        ])));

        $this->audit->record($request, $this->admin($request), 'car', 'created', $car);

        return ApiResponse::created(CarResource::make($car->refresh()->load(self::RELATIONS))->resolve($request), 'Mobil disimpan.');
    }

    public function update(CarRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);

        [$model, $changes] = $this->guardUniquePlate(fn () => $this->updater->update(
            $request,
            $model,
            $request->carValues(),
            $request->integer('version'),
            $admin,
            $request->forceCancelReason(),
        ));

        if ($changes !== []) {
            $this->audit->record($request, $admin, 'car', 'updated', $model, $changes);
        }

        return ApiResponse::ok(CarResource::make($model->load(self::RELATIONS))->resolve($request), 'Mobil disimpan.');
    }

    public function destroy(Request $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);

        $this->updater->delete($model);
        $this->audit->record($request, $admin, 'car', 'deleted', $model);

        return ApiResponse::ok(null, 'Mobil dihapus.');
    }

    /**
     * A concurrent duplicate caught by the partial unique plate index becomes 422.
     *
     * @template T
     *
     * @param  callable(): T  $write
     * @return T
     */
    private function guardUniquePlate(callable $write): mixed
    {
        try {
            return $write();
        } catch (UniqueConstraintViolationException $exception) {
            if (str_contains($exception->getMessage(), 'cars_plate_number_unique')) {
                throw ValidationException::withMessages(['plate_number' => CarRequest::PLATE_TAKEN]);
            }

            throw $exception;
        }
    }
}
