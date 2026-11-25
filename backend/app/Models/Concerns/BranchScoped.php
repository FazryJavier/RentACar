<?php

namespace App\Models\Concerns;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Rows that belong to a branch. Admin modules load them through these helpers so that Staf only
 * ever see their own branch, and another branch's row looks exactly like a missing one (404).
 *
 * Deliberately an explicit scope, not a global scope: public queries must never be filtered by
 * whichever admin happens to be signed in.
 */
trait BranchScoped
{
    /** Column holding the owning branch (`branch_id`; bookings: the pickup branch). */
    public function branchColumn(): string
    {
        return 'branch_id';
    }

    /**
     * @param  Builder<static>  $query
     * @return Builder<static>
     */
    public function scopeVisibleTo(Builder $query, Admin $admin): Builder
    {
        if ($admin->isSuperAdmin()) {
            return $query;
        }

        return $query->where($this->qualifyColumn($this->branchColumn()), $admin->branch_id);
    }

    /**
     * @throws ModelNotFoundException<static> when the row is missing or outside the admin's branch
     */
    public static function findVisibleOrFail(int|string $id, Admin $admin): static
    {
        /** @var static $model */
        $model = static::query()->visibleTo($admin)->findOrFail($id);

        return $model;
    }
}
