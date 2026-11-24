<?php

namespace Database\Factories;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Customer;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    /** Preparation buffer between rentals (Pengaturan `booking.prep_buffer_minutes`, default 120). */
    public const PREP_BUFFER_MINUTES = 120;

    public function definition(): array
    {
        $pickup = CarbonImmutable::now('UTC')->addDays(fake()->numberBetween(2, 60))->setTime(2, 0);
        $days = fake()->numberBetween(1, 5);
        $dailyPrice = fake()->numberBetween(25, 150) * 10_000;
        $deposit = 500_000;

        return [
            'code' => 'RAC-'.$pickup->format('ymd').'-'.Str::upper(Str::random(4)),
            'customer_id' => Customer::factory(),
            // Each booking gets its own car by default, so factories never trip the overlap constraint.
            'car_id' => Car::factory(),
            'branch_id' => fn (array $attributes) => Car::query()->whereKey($attributes['car_id'])->value('branch_id'),
            'pickup_at' => $pickup,
            'return_at' => $pickup->addDays($days),
            'blocked_until' => $pickup->addDays($days)->addMinutes(self::PREP_BUFFER_MINUTES),
            'status' => BookingStatus::Confirmed,
            'payment_deadline' => null,
            'payment_attempts' => 0,
            'rental_days' => $days,
            'daily_price' => $dailyPrice,
            'deposit' => $deposit,
            'rental_subtotal' => $days * $dailyPrice,
            'total_amount' => $days * $dailyPrice + $deposit,
            'renter_name' => fake()->name(),
            'renter_phone' => '628'.fake()->numerify('##########'),
            'renter_license_number' => fake()->numerify('############'),
            'terms_accepted_at' => now(),
        ];
    }

    public function status(BookingStatus $status): static
    {
        return $this->state(fn () => [
            'status' => $status,
            'payment_deadline' => $status === BookingStatus::PendingPayment ? now()->addHours(2) : null,
        ]);
    }

    /**
     * Place the booking on a given car and pickup time (for availability/overlap tests).
     */
    public function forCar(Car $car, CarbonImmutable $pickupAt, int $days = 1): static
    {
        return $this->state(function (array $attributes) use ($car, $pickupAt, $days) {
            $dailyPrice = $car->daily_price;
            $deposit = $car->deposit;

            return [
                'car_id' => $car->id,
                'branch_id' => $car->branch_id,
                'pickup_at' => $pickupAt,
                'return_at' => $pickupAt->addDays($days),
                'blocked_until' => $pickupAt->addDays($days)->addMinutes(self::PREP_BUFFER_MINUTES),
                'rental_days' => $days,
                'daily_price' => $dailyPrice,
                'deposit' => $deposit,
                'rental_subtotal' => $days * $dailyPrice,
                'total_amount' => $days * $dailyPrice + $deposit,
            ];
        });
    }
}
