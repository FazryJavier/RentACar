<?php

namespace App\Domain\Fleet;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use Illuminate\Database\Eloquent\Collection;

/**
 * Bookings that still hold a car's schedule: pending payment (before its deadline), pending
 * verification, confirmed and ongoing.
 */
final class ActiveBookings
{
    /**
     * @param  bool  $upcomingOnly  Only bookings whose blocked period has not ended yet.
     * @param  bool  $lock  Lock the rows (call inside a transaction).
     * @return Collection<int, Booking>
     */
    public function for(Car $car, bool $upcomingOnly = true, bool $lock = false): Collection
    {
        $now = now();

        $query = Booking::query()
            ->where('car_id', $car->id)
            ->whereIn('status', array_map(static fn (BookingStatus $status): string => $status->value, BookingStatus::HOLDING))
            ->where(fn ($inner) => $inner
                ->where('status', '<>', BookingStatus::PendingPayment->value)
                ->orWhere('payment_deadline', '>', $now))
            ->when($upcomingOnly, fn ($inner) => $inner->where('blocked_until', '>', $now))
            ->orderBy('pickup_at');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->get();
    }
}
