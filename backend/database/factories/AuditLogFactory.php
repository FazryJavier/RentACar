<?php

namespace Database\Factories;

use App\Enums\ActorType;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 */
class AuditLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'actor_type' => ActorType::System,
            'actor_id' => null,
            'action' => 'test.performed',
            'subject_type' => null,
            'subject_id' => null,
            'changes' => null,
            'meta' => null,
            'ip_address' => null,
        ];
    }
}
