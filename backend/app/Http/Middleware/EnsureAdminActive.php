<?php

namespace App\Http\Middleware;

use App\Domain\Admin\AdminSession;
use App\Domain\Auth\Exceptions\AccountBlocked;
use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends the session of an admin deactivated while signed in.
 */
final class EnsureAdminActive
{
    public function __construct(private readonly AdminSession $session) {}

    public function handle(Request $request, Closure $next): Response
    {
        $admin = $request->user(AdminSession::GUARD);

        if ($admin instanceof Admin && ! $admin->is_active) {
            $this->session->end($request);

            throw new AccountBlocked;
        }

        return $next($request);
    }
}
