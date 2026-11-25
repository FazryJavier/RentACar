<?php

namespace App\Domain\Auth;

use App\Enums\ActorType;
use App\Support\Audit\AuditLogger;
use Illuminate\Foundation\Auth\User;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Resets a password with a broker token (single use, 60 minutes).
 */
final class ResetPasswordWithBroker
{
    public const INVALID_TOKEN_MESSAGE = 'Tautan atur ulang tidak valid atau sudah kedaluwarsa.';

    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @throws ValidationException when the token is invalid, used or expired
     */
    public function handle(
        string $broker,
        ActorType $actor,
        string $auditAction,
        string $email,
        string $token,
        string $password,
        ?string $ip,
    ): void {
        $status = Password::broker($broker)->reset(
            ['email' => $email, 'token' => $token, 'password' => $password],
            function (User $account, string $password) use ($actor, $auditAction, $ip): void {
                // A new password hash invalidates every other session (AuthenticateSession);
                // a new remember token invalidates "remember me" cookies.
                $account->forceFill(['password' => $password])->setRememberToken(Str::random(60));
                $account->save();

                $key = $account->getKey();
                $this->audit->record($actor, is_int($key) ? $key : null, $auditAction, $account, [], $ip);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => self::INVALID_TOKEN_MESSAGE]);
        }
    }
}
