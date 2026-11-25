<?php

namespace App\Domain\Customer;

use App\Domain\Auth\Exceptions\AccountBlocked;
use App\Domain\Auth\Exceptions\InvalidCredentials;
use App\Domain\Auth\Exceptions\TooManyLoginAttempts;
use App\Domain\Auth\LoginThrottle;
use App\Domain\Auth\PasswordCheck;
use App\Enums\ActorType;
use App\Models\Customer;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\Request;

/**
 * Customer login: failure throttling, generic errors, blocked accounts, session start.
 */
final class AuthenticateCustomer
{
    private LoginThrottle $throttle;

    public function __construct(
        private readonly CustomerSession $session,
        private readonly AuditLogger $audit,
    ) {
        $this->throttle = self::throttle();
    }

    /**
     * @throws TooManyLoginAttempts|InvalidCredentials|AccountBlocked
     */
    public function attempt(Request $request, string $email, string $password, bool $remember): Customer
    {
        $email = mb_strtolower(trim($email));
        $key = $this->throttle->key($request->ip(), $email);
        $this->throttle->ensureNotLocked($key);

        $customer = Customer::query()->where('email', $email)->first();

        if (! PasswordCheck::matches($customer, $password)) {
            $this->throttle->failed($key);
            $this->audit->record(ActorType::System, null, 'customer.login_failed', $customer, ['email' => $email], $request->ip());

            throw new InvalidCredentials;
        }

        $this->throttle->succeeded($key);

        if ($customer->is_blocked) {
            $this->audit->record(ActorType::Customer, $customer->id, 'customer.login_blocked', $customer, [], $request->ip());

            throw new AccountBlocked;
        }

        $this->session->start($request, $customer, $remember);
        $customer->forceFill(['last_login_at' => now()])->save();

        return $customer;
    }

    public static function throttle(): LoginThrottle
    {
        return new LoginThrottle('customer-login');
    }

    public static function throttleKey(?string $ip, string $email): string
    {
        return self::throttle()->key($ip, $email);
    }
}
