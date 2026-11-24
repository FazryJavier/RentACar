<?php

namespace App\Models;

use App\Enums\ActorType;
use Database\Factories\AuditLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Append-only audit record. Never store passwords, tokens or licence numbers in `changes`.
 */
class AuditLog extends Model
{
    /** @use HasFactory<AuditLogFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = ['actor_type', 'actor_id', 'action', 'subject_type', 'subject_id', 'changes', 'meta', 'ip_address'];

    protected function casts(): array
    {
        return [
            'actor_type' => ActorType::class,
            'changes' => 'array',
            'meta' => 'array',
            'created_at' => 'immutable_datetime',
        ];
    }
}
