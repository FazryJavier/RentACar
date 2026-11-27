<?php

namespace App\Domain\Booking;

use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Models\Branch;
use App\Models\Car;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

/**
 * FRD BR-F01-1..3: a car is available when it is active, belongs to the branch, and no
 * schedule-holding booking overlaps [pickup, return + preparation buffer). The overlap uses
 * the same range expression as the `bookings_no_overlap` exclusion constraint (GiST index).
 */
final class AvailabilityQuery
{
    public const BOOKED = 'booked';

    public const OTHER_BRANCH = 'other_branch';

    public const UNAVAILABLE = 'unavailable';

    public function __construct(private readonly BookingSettings $settings) {}

    /**
     * @param  Builder<Car>  $cars
     * @return Builder<Car>
     */
    public function apply(Builder $cars, Branch $branch, RentalWindow $window): Builder
    {
        return $cars
            ->where('cars.status', CarStatus::Active->value)
            ->where('cars.branch_id', $branch->id)
            ->whereNotExists(fn (QueryBuilder $bookings) => $this->conflicts($bookings, $window));
    }

    /** Null when the car can be booked, otherwise the reason it cannot. */
    public function reason(Car $car, Branch $branch, RentalWindow $window): ?string
    {
        if ($car->status !== CarStatus::Active || $car->trashed()) {
            return self::UNAVAILABLE;
        }
        if ($car->branch_id !== $branch->id) {
            return self::OTHER_BRANCH;
        }

        $booked = DB::table('bookings')
            ->where('bookings.car_id', $car->id)
            ->where(fn (QueryBuilder $query) => $this->holdingOverlap($query, $window))
            ->exists();

        return $booked ? self::BOOKED : null;
    }

    private function conflicts(QueryBuilder $bookings, RentalWindow $window): void
    {
        $bookings->select(DB::raw('1'))
            ->from('bookings')
            ->whereColumn('bookings.car_id', 'cars.id');
        $this->holdingOverlap($bookings, $window);
    }

    private function holdingOverlap(QueryBuilder $query, RentalWindow $window): void
    {
        $now = now()->toIso8601String();
        $holding = array_map(static fn (BookingStatus $status): string => $status->value, BookingStatus::HOLDING);

        $query->whereIn('bookings.status', $holding)
            ->where(fn (QueryBuilder $pending) => $pending
                ->where('bookings.status', '<>', BookingStatus::PendingPayment->value)
                ->orWhere('bookings.payment_deadline', '>', $now))
            ->whereRaw(
                "tstzrange(bookings.pickup_at, bookings.blocked_until, '[)') && tstzrange(?::timestamptz, ?::timestamptz, '[)')",
                [$window->pickup->toIso8601String(), $window->blockedUntil($this->settings->prepBufferMinutes())->toIso8601String()],
            );
    }
}
