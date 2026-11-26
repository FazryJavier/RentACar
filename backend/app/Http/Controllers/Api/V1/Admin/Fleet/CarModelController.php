<?php

namespace App\Http\Controllers\Api\V1\Admin\Fleet;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Fleet\CarModelStore;
use App\Http\Controllers\Api\V1\Admin\MasterData\AdminController;
use App\Http\Requests\Admin\Fleet\CarModelRequest;
use App\Http\Requests\Admin\Fleet\CarModelUpdateRequest;
use App\Http\Requests\Admin\Fleet\ImageUploadRequest;
use App\Http\Resources\Admin\CarModel3dResource;
use App\Models\Car;
use App\Models\CarModel3d;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

final class CarModelController extends AdminController
{
    public function __construct(
        private readonly CarModelStore $models,
        private readonly MasterDataAudit $audit,
    ) {}

    public function store(CarModelRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $file = $request->file('file');
        assert($file instanceof UploadedFile);

        [$saved, $previousVersion] = $this->models->save($model, $file, $request->credit());
        $this->audit->record($request, $admin, 'car', 'model_uploaded', $model, [
            'model_version' => [$previousVersion, $saved->model_version],
        ]);

        return ApiResponse::ok(CarModel3dResource::make($saved)->resolve($request), 'Model 3D disimpan.');
    }

    public function update(CarModelUpdateRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = $this->modelOf(Car::findVisibleOrFail($car, $admin));

        [$saved, $changes] = $this->models->update($model, $request->values());
        if ($changes !== []) {
            $this->audit->record($request, $admin, 'car', 'model_updated', $saved->car, $changes);
        }

        return ApiResponse::ok(CarModel3dResource::make($saved)->resolve($request), 'Model 3D disimpan.');
    }

    public function poster(ImageUploadRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = $this->modelOf(Car::findVisibleOrFail($car, $admin));

        $saved = $this->models->savePoster($model, $request->contents());

        return ApiResponse::ok(CarModel3dResource::make($saved)->resolve($request), 'Poster disimpan.');
    }

    public function destroy(Request $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $carModel = Car::findVisibleOrFail($car, $admin);
        $model = $this->modelOf($carModel);

        $this->models->delete($model);
        $this->audit->record($request, $admin, 'car', 'model_removed', $carModel, [
            'model_version' => [$model->model_version, null],
        ]);

        return ApiResponse::ok(null, 'Model 3D dihapus.');
    }

    private function modelOf(Car $car): CarModel3d
    {
        return CarModel3d::query()->where('car_id', $car->id)->firstOrFail();
    }
}
