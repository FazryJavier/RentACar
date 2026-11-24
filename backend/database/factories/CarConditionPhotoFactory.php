<?php

namespace Database\Factories;

use App\Models\CarCondition;
use App\Models\CarConditionPhoto;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CarConditionPhoto>
 */
class CarConditionPhotoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'car_condition_id' => CarCondition::factory(),
            'path' => 'conditions/'.Str::uuid().'.jpg',
            'sort_order' => 0,
        ];
    }
}
