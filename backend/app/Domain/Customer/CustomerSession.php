<?php

namespace App\Domain\Customer;

use App\Models\Customer;
use Illuminate\Auth\SessionGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Starts and ends customer sessions on the `web` guard.
 */
final class CustomerSession
{
    public const GUARD = 'web';

    public function start(Request $request, Customer $customer, bool $remember = false): void
    {
        $guard = $this->guard();
        $guard->login($customer, $remember);
        $request->session()->regenerate();
        $this->storePasswordHash($request, $customer);
    }

    public function end(Request $request): void
    {
        $this->guard()->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }

    /**
     * Records the password hash the way Sanctum's AuthenticateSession checks it, so a later
     * password change signs this session out even before its next authenticated request.
     */
    public function storePasswordHash(Request $request, Customer $customer): void
    {
        $guard = $this->guard();

        $request->session()->put(
            'password_hash_'.self::GUARD,
            $guard->hashPasswordForCookie($customer->getAuthPassword()),
        );
    }

    private function guard(): SessionGuard
    {
        return Auth::guard(self::GUARD);
    }
}
