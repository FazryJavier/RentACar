<?php

namespace App\Http\Controllers\Api\V1\Admin\Fleet;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Fleet\InspectionRecorder;
use App\Http\Controllers\Api\V1\Admin\MasterData\AdminController;
use App\Http\Requests\Admin\Fleet\CarInspectionRequest;
use App\Http\Resources\Admin\CarInspectionResource;
use App\Models\Car;
use App\Models\CarInspection;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class CarInspectionController extends AdminController
{
    public function __construct(
        private readonly InspectionRecorder $recorder,
        private readonly MasterDataAudit $audit,
    ) {}

    public function index(Request $request, int $car): JsonResponse
    {
        $model = Car::findVisibleOrFail($car, $this->admin($request));
        $inspections = CarInspection::query()->where('car_id', $model->id)->with('admin')
            ->orderByDesc('inspected_at')->orderByDesc('id')->limit(100)->get();

        return ApiResponse::ok(CarInspectionResource::collection($inspections)->resolve($request));
    }

    public function store(CarInspectionRequest $request, int $car): JsonResponse
    {
        $admin = $this->admin($request);
        $model = Car::findVisibleOrFail($car, $admin);

        $inspection = $this->recorder->record(
            $model,
            $admin,
            $request->inspectedAt(),
            $request->integer('odometer_km'),
            $request->filled('notes') ? trim($request->string('notes')->toString()) : null,
        );
        $this->audit->record($request, $admin, 'car', 'inspection_recorded', $model, [
            'odometer_km' => [null, $inspection->odometer_km],
        ]);

        return ApiResponse::created(CarInspectionResource::make($inspection->load('admin'))->resolve($request), 'Inspeksi dicatat.');
    }
}
