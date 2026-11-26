<?php

namespace App\Http\Controllers\Api\V1\Admin\MasterData;

use App\Domain\Admin\AdminSession;
use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Shared helpers for admin master-data controllers.
 */
abstract class AdminController extends Controller
{
    protected function admin(Request $request): Admin
    {
        $admin = $request->user(AdminSession::GUARD);
        assert($admin instanceof Admin);

        return $admin;
    }

    /**
     * Runs a write; a concurrent duplicate caught by a `lower(name)` unique index becomes 422.
     *
     * @template T
     *
     * @param  callable(): T  $write
     * @return T
     */
    protected function guardUniqueName(callable $write, string $message): mixed
    {
        try {
            return $write();
        } catch (UniqueConstraintViolationException $exception) {
            if (str_contains($exception->getMessage(), 'name_lower_unique')) {
                throw ValidationException::withMessages(['name' => $message]);
            }

            throw $exception;
        }
    }
}
