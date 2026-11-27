<?php

namespace App\Domain\Booking;

/** FRD F-02 price breakdown, integer Rupiah. */
final readonly class PriceBreakdown
{
    public function __construct(
        public int $dailyPrice,
        public int $rentalDays,
        public int $rentalSubtotal,
        public int $deposit,
        public int $totalAmount,
    ) {}

    /** @return array{daily_price: int, rental_days: int, rental_subtotal: int, deposit: int, total_amount: int} */
    public function toArray(): array
    {
        return [
            'daily_price' => $this->dailyPrice,
            'rental_days' => $this->rentalDays,
            'rental_subtotal' => $this->rentalSubtotal,
            'deposit' => $this->deposit,
            'total_amount' => $this->totalAmount,
        ];
    }

    /** @return array{rental_days: int, rental_subtotal: int, deposit: int, total_amount: int} */
    public function estimate(): array
    {
        return [
            'rental_days' => $this->rentalDays,
            'rental_subtotal' => $this->rentalSubtotal,
            'deposit' => $this->deposit,
            'total_amount' => $this->totalAmount,
        ];
    }
}
