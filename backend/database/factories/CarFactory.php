<?php

namespace Database\Factories;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Car>
 */
class CarFactory extends Factory
{
    public function definition(): array
    {
        $model = fake()->randomElement(['Avanza', 'Xenia', 'Brio', 'Fortuner', 'Pajero', 'Ertiga', 'Innova', 'Jazz']);
        $year = fake()->numberBetween(2018, (int) date('Y'));
        $color = fake()->randomElement(['Hitam', 'Putih', 'Silver', 'Merah', 'Abu-abu']);

        return [
            'slug' => Str::slug("{$model} {$year} {$color}").'-'.Str::lower(Str::random(6)),
            'brand_id' => Brand::factory(),
            'category_id' => Category::factory(),
            'branch_id' => Branch::factory(),
            'model_name' => $model,
            'year' => $year,
            'plate_number' => $this->plateNumber(),
            'color' => $color,
            'transmission' => fake()->randomElement(Transmission::cases()),
            'fuel_type' => fake()->randomElement([FuelType::Gasoline, FuelType::Diesel]),
            'seats' => fake()->randomElement([4, 5, 7, 8]),
            'luggage_capacity' => fake()->numberBetween(1, 4),
            'daily_price' => fake()->numberBetween(25, 150) * 10_000,
            'deposit' => fake()->randomElement([0, 300_000, 500_000, 1_000_000]),
            'description' => fake()->sentence(12),
            'features' => ['AC', 'Audio', 'USB'],
            'status' => CarStatus::Active,
            'odometer_km' => fake()->numberBetween(1_000, 120_000),
        ];
    }

    public function inMaintenance(): static
    {
        return $this->state(fn () => ['status' => CarStatus::Maintenance]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['status' => CarStatus::Inactive]);
    }

    /**
     * Indonesian-style plate, normalised: "B 1234 XYZ".
     */
    private function plateNumber(): string
    {
        $region = fake()->randomElement(['B', 'D', 'L', 'AB', 'H', 'DK', 'F']);

        return $region.' '.fake()->unique()->numberBetween(1000, 9999).' '.Str::upper(fake()->lexify('???'));
    }
}
