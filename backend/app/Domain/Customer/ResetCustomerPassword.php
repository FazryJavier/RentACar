<?php

namespace App\Domain\Customer;

use App\Enums\ActorType;
use App\Models\Customer;
use App\Support\Audit\AuditLogger;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Resets a password with a broker token (single use, 60 minutes).
 */
final class ResetCustomerPassword
{
    public const INVALID_TOKEN_MESSAGE = 'Tautan atur ulang tidak valid atau sudah kedaluwarsa.';

    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @throws ValidationException when the token is invalid, used or expired
     */
    public function handle(string $email, string $token, string $password, ?string $ip): void
    {
        $status = Password::broker('customers')->reset(
            ['email' => $email, 'token' => $token, 'password' => $password],
            function (Customer $customer, string $password) use ($ip): void {
                // A new password hash invalidates every other session (AuthenticateSession);
                // a new remember token invalidates "remember me" cookies.
                $customer->forceFill(['password' => $password])->setRememberToken(Str::random(60));
                $customer->save();

                $this->audit->record(ActorType::Customer, $customer->id, 'customer.password_reset', $customer, [], $ip);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => self::INVALID_TOKEN_MESSAGE]);
        }
    }
}
