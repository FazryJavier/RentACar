<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\CarPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CarPhoto>
 */
class CarPhotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'path' => 'cars/'.Str::uuid().'.jpg',
            'variants' => [],
            'alt_text' => 'Foto mobil tampak depan samping',
            'sort_order' => 0,
            'processed_at' => now(),
        ];
    }
}
