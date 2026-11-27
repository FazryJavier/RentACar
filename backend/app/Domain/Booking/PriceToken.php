<?php

namespace App\Domain\Booking;

use App\Models\Branch;
use App\Models\Car;

/**
 * HMAC over a car, branch, window and price breakdown. Sent back when booking (US-16) so the
 * server can tell whether the price the customer agreed to is still the price it computes.
 */
final class PriceToken
{
    private const VERSION = 'v1';

    public function issue(Car $car, Branch $branch, RentalWindow $window, PriceBreakdown $price): string
    {
        return rtrim(strtr(base64_encode(hash_hmac('sha256', $this->canonical($car, $branch, $window, $price), $this->key(), true)), '+/', '-_'), '=');
    }

    public function verify(string $token, Car $car, Branch $branch, RentalWindow $window, PriceBreakdown $price): bool
    {
        return hash_equals($this->issue($car, $branch, $window, $price), $token);
    }

    private function canonical(Car $car, Branch $branch, RentalWindow $window, PriceBreakdown $price): string
    {
        return implode('|', [
            self::VERSION, $car->id, $branch->id,
            $window->pickup->utc()->format('Y-m-d\TH:i:s\Z'), $window->return->utc()->format('Y-m-d\TH:i:s\Z'),
            $price->dailyPrice, $price->rentalDays, $price->rentalSubtotal, $price->deposit, $price->totalAmount,
        ]);
    }

    /** A key derived from APP_KEY for this purpose only. */
    private function key(): string
    {
        return hash_hmac('sha256', 'rentacar.price-token', (string) config('app.key'), true);
    }
}
