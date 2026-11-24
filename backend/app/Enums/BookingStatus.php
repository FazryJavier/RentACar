<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/**
 * Booking lifecycle status.
 */
enum BookingStatus: string
{
    use HasValues;

    case PendingPayment = 'pending_payment';

    case PendingVerification = 'pending_verification';

    case Confirmed = 'confirmed';

    case Ongoing = 'ongoing';

    case Completed = 'completed';

    case Cancelled = 'cancelled';

    case Rejected = 'rejected';

    case Expired = 'expired';

    /**
     * Statuses that keep the car's schedule blocked (used by the bookings_no_overlap constraint).
     */
    public const HOLDING = [
        self::PendingPayment,
        self::PendingVerification,
        self::Confirmed,
        self::Ongoing,
    ];

    public function holdsSchedule(): bool
    {
        return in_array($this, self::HOLDING, true);
    }

    public function isFinal(): bool
    {
        return in_array($this, [self::Completed, self::Cancelled, self::Rejected, self::Expired], true);
    }

    /**
     * SQL list of schedule-holding statuses, e.g. 'pending_payment', 'confirmed'.
     */
    public static function holdingSqlList(): string
    {
        return implode(', ', array_map(static fn (self $s): string => "'{$s->value}'", self::HOLDING));
    }
}
