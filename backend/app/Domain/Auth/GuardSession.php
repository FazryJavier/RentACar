<?php

namespace App\Domain\Auth;

use Illuminate\Auth\SessionGuard;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Starts and ends sessions on one session guard (`web` for customers, `admin` for admins).
 */
class GuardSession
{
    public function __construct(public readonly string $guard) {}

    public function start(Request $request, Authenticatable $user, bool $remember = false): void
    {
        $this->sessionGuard()->login($user, $remember);
        $request->session()->regenerate();
        $this->storePasswordHash($request, $user);
    }

    public function end(Request $request): void
    {
        $this->sessionGuard()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    /**
     * Records the password hash the way Sanctum's AuthenticateSession checks it, so a later
     * password change signs this session out even before its next authenticated request.
     */
    public function storePasswordHash(Request $request, Authenticatable $user): void
    {
        $request->session()->put(
            'password_hash_'.$this->guard,
            $this->sessionGuard()->hashPasswordForCookie($user->getAuthPassword()),
        );
    }

    private function sessionGuard(): SessionGuard
    {
        /** @var SessionGuard $guard */
        $guard = Auth::guard($this->guard);

        return $guard;
    }
}
