<?php

namespace App\Domain\Admin;

use App\Domain\Auth\Exceptions\AccountBlocked;
use App\Domain\Auth\Exceptions\InvalidCredentials;
use App\Domain\Auth\Exceptions\TooManyLoginAttempts;
use App\Domain\Auth\LoginThrottle;
use App\Domain\Auth\PasswordCheck;
use App\Enums\ActorType;
use App\Models\Admin;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\Request;

/**
 * Admin login: same rules as customers (failure throttling, generic errors), plus inactive
 * accounts are refused. Soft-deleted admins are never found, so they get the generic error.
 */
final class AuthenticateAdmin
{
    private LoginThrottle $throttle;

    public function __construct(
        private readonly AdminSession $session,
        private readonly AuditLogger $audit,
    ) {
        $this->throttle = self::throttle();
    }

    /**
     * @throws TooManyLoginAttempts|InvalidCredentials|AccountBlocked
     */
    public function attempt(Request $request, string $email, string $password, bool $remember): Admin
    {
        $email = mb_strtolower(trim($email));
        $key = $this->throttle->key($request->ip(), $email);
        $this->throttle->ensureNotLocked($key);

        $admin = Admin::query()->whereRaw('lower(email) = ?', [$email])->first();

        if (! PasswordCheck::matches($admin, $password)) {
            $this->throttle->failed($key);
            $this->audit->record(ActorType::System, null, 'admin.login_failed', $admin, ['email' => $email], $request->ip());

            throw new InvalidCredentials;
        }

        $this->throttle->succeeded($key);

        if (! $admin->is_active) {
            $this->audit->record(ActorType::Admin, $admin->id, 'admin.login_blocked', $admin, [], $request->ip());

            throw new AccountBlocked;
        }

        $this->session->start($request, $admin, $remember);
        $admin->forceFill(['last_login_at' => now()])->save();

        return $admin;
    }

    public static function throttle(): LoginThrottle
    {
        return new LoginThrottle('admin-login');
    }

    public static function throttleKey(?string $ip, string $email): string
    {
        return self::throttle()->key($ip, $email);
    }
}
