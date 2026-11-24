<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\CarInspection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CarInspection>
 */
class CarInspectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'booking_id' => null,
            'admin_id' => null,
            'inspected_at' => now()->subDays(fake()->numberBetween(0, 30)),
            'odometer_km' => fake()->numberBetween(1_000, 120_000),
            'notes' => 'Inspeksi rutin.',
        ];
    }
}
