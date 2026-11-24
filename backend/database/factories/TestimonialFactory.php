<?php

namespace Database\Factories;

use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Testimonial>
 */
class TestimonialFactory extends Factory
{
    public function definition(): array
    {
        return [
            'booking_id' => null,
            'name' => fake()->firstName(),
            'city' => fake()->city(),
            'quote' => 'Mobil bersih dan proses pemesanan mudah.',
            'rating' => fake()->numberBetween(4, 5),
            'avatar_path' => null,
            'is_demo' => true,
            'is_published' => true,
        ];
    }
}
