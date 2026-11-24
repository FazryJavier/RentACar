<?php

namespace Database\Factories;

use App\Enums\ConditionArea;
use App\Enums\ConditionSeverity;
use App\Models\Car;
use App\Models\CarCondition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CarCondition>
 */
class CarConditionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'area' => fake()->randomElement(ConditionArea::cases()),
            'severity' => fake()->randomElement(ConditionSeverity::cases()),
            'description' => 'Goresan halus sekitar 5 cm',
            'position' => null,
            'normal' => null,
            'model_version' => null,
            'inspected_on' => now('Asia/Jakarta')->subDays(fake()->numberBetween(0, 60))->toDateString(),
            'is_resolved' => false,
        ];
    }

    public function onModel(int $modelVersion = 1): static
    {
        return $this->state(fn () => [
            'position' => [fake()->randomFloat(3, -1, 1), fake()->randomFloat(3, 0, 1.5), fake()->randomFloat(3, -2, 2)],
            'normal' => [0, 0, 1],
            'model_version' => $modelVersion,
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn () => ['is_resolved' => true, 'resolved_at' => now()]);
    }
}
