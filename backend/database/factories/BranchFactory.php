<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Branch>
 */
class BranchFactory extends Factory
{
    public function definition(): array
    {
        $city = fake()->randomElement(['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Denpasar']);
        $name = 'RentACar '.$city.' '.fake()->unique()->numberBetween(1, 9999);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'address' => fake()->streetAddress(),
            'city' => $city,
            'phone' => '021'.fake()->numerify('#######'),
            'opening_time' => '07:00',
            'closing_time' => '21:00',
            'latitude' => fake()->randomFloat(6, -8.8, -6.0),
            'longitude' => fake()->randomFloat(6, 106.6, 115.3),
            'is_active' => true,
        ];
    }
}
