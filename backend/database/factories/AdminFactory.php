<?php

namespace Database\Factories;

use App\Enums\AdminRole;
use App\Models\Admin;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Admin>
 */
class AdminFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->userName().'@example.test',
            'password' => 'password-for-tests-only',
            'role' => AdminRole::Staff,
            'branch_id' => Branch::factory(),
            'is_active' => true,
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => ['role' => AdminRole::SuperAdmin, 'branch_id' => null]);
    }

    public function staff(?Branch $branch = null): static
    {
        return $this->state(fn () => ['role' => AdminRole::Staff, 'branch_id' => $branch !== null ? $branch->id : Branch::factory()]);
    }
}
