<?php

namespace App\Http\Controllers\Api\V1\Admin\Fleet;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Fleet\CarPhotoStore;
use App\Http\Controllers\Api\V1\Admin\MasterData\AdminController;
use App\Http\Requests\Admin\Fleet\CarPhotoOrderRequest;
use App\Http\Requests\Admin\Fleet\CarPhotoRequest;
use App\Http\Resources\Admin\CarPhotoResource;
use App\Models\Car;
use App\Models\CarPhoto;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

final class CarPhotoController extends AdminController
{
    public function __construct(
        private readonly CarPhotoStore $photos,
        private readonly MasterDataAudit $audit,
    ) {}

    public function store(CarPhotoRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $file = $request->file('photo');
        assert($file instanceof UploadedFile);

        $photo = $this->photos->add($model, $file, $request->input('alt_text'));
        $this->audit->record($request, $admin, 'car', 'photo_added', $model, ['photo_id' => [null, $photo->id]]);

        return ApiResponse::created(CarPhotoResource::make($photo->refresh())->resolve($request), 'Foto diunggah dan sedang diproses.');
    }

    public function order(CarPhotoOrderRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $before = $model->photos()->pluck('id')->all();

        $this->photos->reorder($model, $request->photoIds());
        $this->audit->record($request, $admin, 'car', 'photos_reordered', $model, ['photo_ids' => [$before, $request->photoIds()]]);

        return ApiResponse::ok(CarPhotoResource::collection($model->photos()->get())->resolve($request), 'Urutan foto disimpan.');
    }

    public function destroy(Request $request, int $car, int $photo): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);
        $record = CarPhoto::query()->where('car_id', $model->id)->findOrFail($photo);

        $this->photos->delete($model, $record);
        $this->audit->record($request, $admin, 'car', 'photo_removed', $model, ['photo_id' => [$record->id, null]]);

        return ApiResponse::ok(null, 'Foto dihapus.');
    }
}
