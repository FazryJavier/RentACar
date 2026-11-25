<?php

namespace App\Http\Middleware;

use App\Domain\Admin\AdminSession;
use App\Enums\AdminRole;
use App\Models\Admin;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route to admin roles, e.g. `admin.role:super_admin` (403 for other roles).
 */
final class EnsureAdminRole
{
    /**
     * @throws AuthenticationException when there is no admin session
     * @throws AuthorizationException when the admin's role is not allowed
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $admin = $request->user(AdminSession::GUARD);

        if (! $admin instanceof Admin) {
            throw new AuthenticationException;
        }

        $allowed = array_map(static fn (string $role): AdminRole => AdminRole::from($role), $roles);

        if (! in_array($admin->role, $allowed, true)) {
            throw new AuthorizationException;
        }

        return $next($request);
    }
}
