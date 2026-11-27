<?php

namespace App\Domain\Booking;

use App\Models\Car;

/** FRD F-02: days = max(1, ceil(minutes / 1440)); total = days × daily price + deposit. */
final class PriceCalculator
{
    public function for(Car $car, RentalWindow $window): PriceBreakdown
    {
        return self::compute($car->daily_price, $car->deposit, $window->minutes());
    }

    public static function compute(int $dailyPrice, int $deposit, int $minutes): PriceBreakdown
    {
        $days = max(1, intdiv($minutes + 1439, 1440));
        $subtotal = $days * $dailyPrice;

        return new PriceBreakdown($dailyPrice, $days, $subtotal, $deposit, $subtotal + $deposit);
    }
}
