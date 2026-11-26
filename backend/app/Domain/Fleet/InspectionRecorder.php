<?php

namespace App\Domain\Fleet;

use App\Models\Admin;
use App\Models\Car;
use App\Models\CarInspection;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Records an inspection and keeps the car's last inspection time and odometer current
 * (latest time wins; the odometer only goes up).
 */
final class InspectionRecorder
{
    public function record(Car $car, Admin $admin, CarbonImmutable $inspectedAt, int $odometerKm, ?string $notes): CarInspection
    {
        return DB::transaction(function () use ($car, $admin, $inspectedAt, $odometerKm, $notes): CarInspection {
            $inspection = CarInspection::query()->create([
                'car_id' => $car->id,
                'admin_id' => $admin->id,
                'inspected_at' => $inspectedAt->utc(),
                'odometer_km' => $odometerKm,
                'notes' => $notes,
            ]);

            $at = $inspectedAt->utc()->toIso8601String();
            DB::update(
                'UPDATE cars SET last_inspected_at = GREATEST(COALESCE(last_inspected_at, ?::timestamptz), ?::timestamptz), '
                .'odometer_km = GREATEST(odometer_km, ?) WHERE id = ?',
                [$at, $at, $odometerKm, $car->id],
            );

            return $inspection;
        });
    }
}
