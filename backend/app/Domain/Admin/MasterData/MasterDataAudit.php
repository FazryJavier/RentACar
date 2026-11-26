<?php

namespace App\Domain\Admin\MasterData;

use App\Enums\ActorType;
use App\Models\Admin;
use App\Support\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Audit entries for master-data changes: `admin.<entity>.<action>` with field changes.
 */
final class MasterDataAudit
{
    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @param  array<string, array{0: mixed, 1: mixed}>  $changes
     */
    public function record(Request $request, Admin $admin, string $entity, string $action, Model $subject, array $changes = []): void
    {
        $this->audit->record(ActorType::Admin, $admin->id, "admin.{$entity}.{$action}", $subject, [], $request->ip(), $changes);
    }
}
