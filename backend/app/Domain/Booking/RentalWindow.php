<?php

namespace App\Domain\Booking;

use Carbon\CarbonImmutable;

/** A validated pickup/return pair, stored in UTC. */
final readonly class RentalWindow
{
    public function __construct(public CarbonImmutable $pickup, public CarbonImmutable $return) {}

    public function minutes(): int
    {
        return (int) $this->pickup->diffInMinutes($this->return);
    }

    /** End of the period the car stays blocked after this rental (return + preparation buffer). */
    public function blockedUntil(int $bufferMinutes): CarbonImmutable
    {
        return $this->return->addMinutes($bufferMinutes);
    }
}
