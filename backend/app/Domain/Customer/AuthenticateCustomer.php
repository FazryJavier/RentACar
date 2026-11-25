<?php

namespace App\Domain\Customer;

use App\Domain\Customer\Exceptions\AccountBlocked;
use App\Domain\Customer\Exceptions\InvalidCredentials;
use App\Domain\Customer\Exceptions\TooManyLoginAttempts;
use App\Enums\ActorType;
use App\Models\Customer;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Customer login: failure throttling, generic errors, blocked accounts, session start.
 */
final class AuthenticateCustomer
{
    public const MAX_FAILURES = 5;

    public const DECAY_SECONDS = 60;

    /** Hash of a random value, checked when the email is unknown so both cases cost the same. */
    private const DUMMY_HASH = '$2y$12$BKC0MlVTifQsfDuYUjUd0uajantB3l6yw83cVWnbnOFdTlvVcNafq';

    public function __construct(
        private readonly CustomerSession $session,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @throws TooManyLoginAttempts|InvalidCredentials|AccountBlocked
     */
    public function attempt(Request $request, string $email, string $password, bool $remember): Customer
    {
        $email = mb_strtolower(trim($email));
        $key = self::throttleKey($request->ip(), $email);

        if (RateLimiter::tooManyAttempts($key, self::MAX_FAILURES)) {
            throw new TooManyLoginAttempts(max(1, RateLimiter::availableIn($key)));
        }

        $customer = Customer::query()->where('email', $email)->first();
        $valid = Hash::check($password, $customer->password ?? self::DUMMY_HASH) && $customer !== null;

        if (! $valid) {
            RateLimiter::hit($key, self::DECAY_SECONDS);
            $this->audit->record(ActorType::System, null, 'customer.login_failed', $customer, ['email' => $email], $request->ip());

            throw new InvalidCredentials;
        }

        RateLimiter::clear($key);

        if ($customer->is_blocked) {
            $this->audit->record(ActorType::Customer, $customer->id, 'customer.login_blocked', $customer, [], $request->ip());

            throw new AccountBlocked;
        }

        $this->session->start($request, $customer, $remember);
        $customer->forceFill(['last_login_at' => now()])->save();

        return $customer;
    }

    public static function throttleKey(?string $ip, string $email): string
    {
        return 'customer-login:'.($ip ?? 'unknown').'|'.mb_strtolower(trim($email));
    }
}
