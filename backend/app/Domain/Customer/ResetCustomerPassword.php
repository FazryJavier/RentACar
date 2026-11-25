<?php

namespace App\Domain\Customer;

use App\Domain\Auth\ResetPasswordWithBroker;
use App\Enums\ActorType;
use Illuminate\Validation\ValidationException;

/**
 * Resets a customer password with a broker token (single use, 60 minutes).
 */
final class ResetCustomerPassword
{
    public const INVALID_TOKEN_MESSAGE = ResetPasswordWithBroker::INVALID_TOKEN_MESSAGE;

    public function __construct(private readonly ResetPasswordWithBroker $reset) {}

    /**
     * @throws ValidationException when the token is invalid, used or expired
     */
    public function handle(string $email, string $token, string $password, ?string $ip): void
    {
        $this->reset->handle('customers', ActorType::Customer, 'customer.password_reset', $email, $token, $password, $ip);
    }
}
