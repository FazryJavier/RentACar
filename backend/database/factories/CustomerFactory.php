<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->userName().'@example.test',
            'phone' => '628'.fake()->numerify('##########'),
            'password' => 'password-for-tests-only',
            'address' => fake()->address(),
            'license_number' => fake()->numerify('############'),
            'is_blocked' => false,
        ];
    }

    public function blocked(): static
    {
        return $this->state(fn () => ['is_blocked' => true, 'blocked_reason' => 'Diblokir untuk pengujian.']);
    }
}
