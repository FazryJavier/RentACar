<?php

namespace Database\Factories;

use App\Enums\ActorType;
use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\BookingStatusHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookingStatusHistory>
 */
class BookingStatusHistoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'from_status' => null,
            'to_status' => BookingStatus::PendingPayment,
            'actor_type' => ActorType::Customer,
            'actor_id' => null,
            'reason' => null,
        ];
    }
}
