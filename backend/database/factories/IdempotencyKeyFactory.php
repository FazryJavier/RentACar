<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\IdempotencyKey;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<IdempotencyKey>
 */
class IdempotencyKeyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'key' => (string) Str::uuid(),
            'request_hash' => hash('sha256', Str::random(32)),
            'booking_id' => null,
            'expires_at' => now()->addDay(),
        ];
    }
}
