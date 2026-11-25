<?php

namespace App\Support\Audit;

use App\Enums\ActorType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Writes rows to `audit_logs`. Callers must never pass passwords, tokens or other secrets.
 */
final class AuditLogger
{
    /**
     * @param  array<string, scalar|null>  $meta
     */
    public function record(
        ActorType $actorType,
        ?int $actorId,
        string $action,
        ?Model $subject = null,
        array $meta = [],
        ?string $ip = null,
    ): void {
        DB::table('audit_logs')->insert([
            'actor_type' => $actorType->value,
            'actor_id' => $actorId,
            'action' => $action,
            'subject_type' => $subject !== null ? $subject->getMorphClass() : null,
            'subject_id' => $subject?->getKey(),
            'meta' => $meta === [] ? null : json_encode($meta, JSON_THROW_ON_ERROR),
            'ip_address' => $ip,
        ]);
    }
}
