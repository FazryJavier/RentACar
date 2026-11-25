<?php

namespace App\Policies;

use App\Models\Admin;

/**
 * Shared checks for admin module policies (Super Admin: all branches; Staf: one branch).
 */
abstract class AdminPolicy
{
    /** Whether the admin may act on data of the given branch (null = not branch-bound). */
    protected function canAccessBranch(Admin $admin, ?int $branchId): bool
    {
        return $admin->isSuperAdmin() || ($branchId !== null && $admin->branch_id === $branchId);
    }
}
