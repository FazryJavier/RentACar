<?php

namespace App\Http\Controllers\Api\V1\Admin\Fleet;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Fleet\ConditionService;
use App\Http\Controllers\Api\V1\Admin\MasterData\AdminController;
use App\Http\Requests\Admin\Fleet\CarConditionRequest;
use App\Http\Requests\Admin\Fleet\ImageUploadRequest;
use App\Http\Resources\Admin\CarConditionResource;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarConditionPhoto;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

final class CarConditionController extends AdminController
{
    public function __construct(
        private readonly ConditionService $conditions,
        private readonly MasterDataAudit $audit,
    ) {}

    public function index(Request $request, int $car): JsonResponse
    {
        return ApiResponse::ok($this->present(Car::findVisibleOrFail($car, $this->admin($request))));
    }

    public function store(CarConditionRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);

        $condition = $this->conditions->create($model, $admin, $request->values());
        $this->audit->record($request, $admin, 'car', 'condition_created', $model, ['condition_id' => [null, $condition->id]]);

        return ApiResponse::created($this->presentOne($model, $condition), 'Penanda disimpan.');
    }

    public function update(CarConditionRequest $request, int $car, int $condition): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $record = $this->conditionOf($model, $condition);

        [$saved, $changes] = $this->conditions->update($model, $record, $request->values());
        if ($changes !== []) {
            $this->audit->record($request, $admin, 'car', 'condition_updated', $model, ['condition_id' => [$saved->id, $saved->id], ...$changes]);
        }

        return ApiResponse::ok($this->presentOne($model, $saved), 'Penanda disimpan.');
    }

    public function destroy(Request $request, int $car, int $condition): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $record = $this->conditionOf($model, $condition);

        $this->conditions->delete($record);
        $this->audit->record($request, $admin, 'car', 'condition_deleted', $model, ['condition_id' => [$record->id, null]]);

        return ApiResponse::ok(null, 'Penanda dihapus.');
    }

    public function storePhoto(ImageUploadRequest $request, int $car, int $condition): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $record = $this->conditionOf($model, $condition);
        $file = $request->file('photo');
        assert($file instanceof UploadedFile);

        $this->conditions->addPhoto($record, $file);

        return ApiResponse::created($this->presentOne($model, $record->refresh()), 'Foto penanda disimpan.');
    }

    public function destroyPhoto(Request $request, int $car, int $condition, int $photo): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $record = $this->conditionOf($model, $condition);
        $photoRecord = CarConditionPhoto::query()->where('car_condition_id', $record->id)->findOrFail($photo);

        $this->conditions->deletePhoto($photoRecord);

        return ApiResponse::ok($this->presentOne($model, $record->refresh()), 'Foto penanda dihapus.');
    }

    private function conditionOf(Car $car, int $id): CarCondition
    {
        return CarCondition::query()->where('car_id', $car->id)->findOrFail($id);
    }

    /** @return list<array<string, mixed>> */
    private function present(Car $car): array
    {
        $conditions = CarCondition::query()->where('car_id', $car->id)->with('photos')->get();

        return CarConditionResource::list($conditions, $car->model3d()->value('model_version'));
    }

    /** @return array<string, mixed> */
    private function presentOne(Car $car, CarCondition $condition): array
    {
        $number = CarCondition::query()->where('car_id', $car->id)
            ->where(fn ($query) => $query->where('created_at', '<', $condition->created_at)
                ->orWhere(fn ($same) => $same->where('created_at', $condition->created_at)->where('id', '<=', $condition->id)))
            ->count();

        return CarConditionResource::one($condition->load('photos'), $number, $car->model3d()->value('model_version'));
    }
}
