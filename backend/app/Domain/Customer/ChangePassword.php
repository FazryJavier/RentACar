<?php

namespace App\Domain\Customer;

use App\Enums\ActorType;
use App\Http\Requests\Customer\ChangePasswordRequest;
use App\Models\Customer;
use App\Support\Audit\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Changes the password of the signed-in customer; other sessions are signed out.
 */
final class ChangePassword
{
    public function __construct(
        private readonly CustomerSession $session,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * @throws ValidationException when the current password is wrong
     */
    public function handle(Request $request, Customer $customer, string $current, string $new): void
    {
        if (! Hash::check($current, $customer->password)) {
            throw ValidationException::withMessages(['current_password' => ChangePasswordRequest::WRONG_CURRENT_MESSAGE]);
        }

        $customer->forceFill(['password' => $new])->setRememberToken(Str::random(60));
        $customer->save();

        // Keep this session: new ID and the new password hash, so AuthenticateSession accepts it
        // while every other session (old hash) is signed out on its next request.
        $request->session()->regenerate();
        $this->session->storePasswordHash($request, $customer);

        $this->audit->record(ActorType::Customer, $customer->id, 'customer.password_changed', $customer, [], $request->ip());
    }
}
