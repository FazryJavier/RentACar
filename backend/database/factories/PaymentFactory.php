<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'attempt_no' => 1,
            'amount' => fn (array $attributes) => (int) Booking::query()->whereKey($attributes['booking_id'])->value('total_amount'),
            'proof_path' => 'payments/'.Str::uuid().'.jpg',
            'proof_mime' => 'image/jpeg',
            'proof_size' => fake()->numberBetween(50_000, 2_000_000),
            'status' => PaymentStatus::Pending,
        ];
    }

    public function verified(): static
    {
        return $this->state(fn () => ['status' => PaymentStatus::Verified, 'reviewed_at' => now()]);
    }

    public function rejected(string $reason = 'Nominal transfer tidak sesuai.'): static
    {
        return $this->state(fn () => ['status' => PaymentStatus::Rejected, 'reviewed_at' => now(), 'reject_reason' => $reason]);
    }
}
