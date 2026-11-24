<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\CarModel3d;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CarModel3d>
 */
class CarModel3dFactory extends Factory
{
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'file_path' => 'models/'.Str::uuid().'.glb',
            'file_size' => fake()->numberBetween(500_000, 5_000_000),
            'poster_path' => 'models/'.Str::uuid().'.webp',
            'camera' => ['position' => [4, 2, 6], 'target' => [0, 0.5, 0]],
            'source_name' => 'Model contoh',
            'source_url' => null,
            'license' => 'CC-BY-4.0',
            'is_illustrative' => true,
            'model_version' => 1,
        ];
    }
}
