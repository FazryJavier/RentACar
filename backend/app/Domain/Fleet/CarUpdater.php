<?php

namespace App\Domain\Fleet;

use App\Domain\Admin\MasterData\VersionConflict;
use App\Domain\Admin\MasterData\VersionedUpdate;
use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Models\Admin;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Updates a car with optimistic locking, guarding status and branch changes against bookings
 * that still hold the car's schedule (optionally cancelling them for a status change).
 */
final class CarUpdater
{
    public function __construct(
        private readonly VersionedUpdate $versioned,
        private readonly ActiveBookings $bookings,
        private readonly BookingCanceller $canceller,
    ) {}

    /**
     * @param  array<string, mixed>  $values
     * @return array{0: Car, 1: array<string, array{0: mixed, 1: mixed}>}
     *
     * @throws VersionConflict
     * @throws CarHasActiveBookings
     */
    public function update(
        Request $request,
        Car $car,
        array $values,
        int $expectedVersion,
        Admin $admin,
        ?string $forceCancelReason = null,
    ): array {
        return DB::transaction(function () use ($request, $car, $values, $expectedVersion, $admin, $forceCancelReason): array {
            $locked = Car::query()->whereKey($car->id)->lockForUpdate()->firstOrFail();

            if ($locked->version !== $expectedVersion) {
                throw new VersionConflict;
            }

            $newStatus = isset($values['status']) ? CarStatus::tryFrom((string) $values['status']) : null;
            $leavesService = $newStatus !== null
                && $newStatus !== $locked->status
                && in_array($newStatus, [CarStatus::Maintenance, CarStatus::Inactive], true);
            $movesBranch = isset($values['branch_id']) && (int) $values['branch_id'] !== $locked->branch_id;

            if ($leavesService || $movesBranch) {
                $active = $this->bookings->for($locked, upcomingOnly: true, lock: true);

                if ($active->isNotEmpty()) {
                    if ($movesBranch) {
                        throw CarHasActiveBookings::forBranchMove($active);
                    }

                    $hasOngoing = $active->contains(fn ($booking): bool => $booking->status === BookingStatus::Ongoing);
                    if ($forceCancelReason === null || $hasOngoing) {
                        throw CarHasActiveBookings::forStatusChange($active);
                    }

                    foreach ($active as $booking) {
                        $this->canceller->cancelByAdmin($request, $booking, $admin, $forceCancelReason);
                    }
                }
            }

            return $this->versioned->apply($locked, $values, $expectedVersion);
        });
    }

    /**
     * Soft-deletes the car unless bookings still hold its schedule.
     *
     * @throws CarHasActiveBookings
     */
    public function delete(Car $car): void
    {
        DB::transaction(function () use ($car): void {
            $locked = Car::query()->whereKey($car->id)->lockForUpdate()->firstOrFail();
            $active = $this->bookings->for($locked, upcomingOnly: false, lock: true);

            if ($active->isNotEmpty()) {
                throw CarHasActiveBookings::forDeletion($active);
            }

            $locked->delete();
        });
    }
}
