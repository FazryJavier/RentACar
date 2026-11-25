<?php

namespace App\Domain\Customer;

use App\Domain\Auth\ChangeAccountPassword;
use App\Enums\ActorType;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Changes the password of the signed-in customer; other sessions are signed out.
 */
final class ChangePassword
{
    public function __construct(
        private readonly CustomerSession $session,
        private readonly ChangeAccountPassword $change,
    ) {}

    /**
     * @throws ValidationException when the current password is wrong
     */
    public function handle(Request $request, Customer $customer, string $current, string $new): void
    {
        $this->change->handle($request, $customer, $this->session, ActorType::Customer, 'customer.password_changed', $current, $new);
    }
}
