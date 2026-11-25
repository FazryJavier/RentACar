<?php

namespace App\Domain\Auth;

use App\Domain\Auth\Exceptions\TooManyLoginAttempts;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Counts failed logins per IP + email: 5 failures within 60 seconds lock further attempts.
 */
final class LoginThrottle
{
    public const MAX_FAILURES = 5;

    public const DECAY_SECONDS = 60;

    public function __construct(private readonly string $prefix) {}

    public function key(?string $ip, string $email): string
    {
        return $this->prefix.':'.($ip ?? 'unknown').'|'.mb_strtolower(trim($email));
    }

    /**
     * @throws TooManyLoginAttempts
     */
    public function ensureNotLocked(string $key): void
    {
        if (RateLimiter::tooManyAttempts($key, self::MAX_FAILURES)) {
            throw new TooManyLoginAttempts(max(1, RateLimiter::availableIn($key)));
        }
    }

    public function failed(string $key): void
    {
        RateLimiter::hit($key, self::DECAY_SECONDS);
    }

    public function succeeded(string $key): void
    {
        RateLimiter::clear($key);
    }
}
