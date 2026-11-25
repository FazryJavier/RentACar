<?php

namespace App\Domain\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Hash;

/**
 * Compares a password with an account's hash, or with a dummy hash when the account does not
 * exist, so "unknown email" and "wrong password" take comparable time.
 */
final class PasswordCheck
{
    /** Hash of a random value; never matches a real password. */
    private const DUMMY_HASH = '$2y$12$BKC0MlVTifQsfDuYUjUd0uajantB3l6yw83cVWnbnOFdTlvVcNafq';

    /**
     * @phpstan-assert-if-true !null $user
     */
    public static function matches(?Authenticatable $user, string $password): bool
    {
        $matches = Hash::check($password, $user?->getAuthPassword() ?? self::DUMMY_HASH);

        return $matches && $user !== null;
    }
}
