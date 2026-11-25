<?php

namespace App\Domain\Auth;

use App\Enums\ActorType;
use App\Support\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Changes the signed-in account's password; this session stays, every other session ends.
 */
final class ChangeAccountPassword
{
    public const WRONG_CURRENT_MESSAGE = 'Kata sandi lama salah';

    public function __construct(private readonly AuditLogger $audit) {}

    /**
     * @throws ValidationException when the current password is wrong
     */
    public function handle(
        Request $request,
        User $account,
        GuardSession $session,
        ActorType $actor,
        string $auditAction,
        string $current,
        string $new,
    ): void {
        if (! Hash::check($current, $account->getAuthPassword())) {
            throw ValidationException::withMessages(['current_password' => self::WRONG_CURRENT_MESSAGE]);
        }

        $account->forceFill(['password' => $new])->setRememberToken(Str::random(60));
        $account->save();

        // Keep this session: new ID and the new password hash, so AuthenticateSession accepts it
        // while every other session (old hash) is signed out on its next request.
        $request->session()->regenerate();
        $session->storePasswordHash($request, $account);

        $this->audit->record($actor, $this->id($account), $auditAction, $account, [], $request->ip());
    }

    private function id(Model $account): ?int
    {
        $key = $account->getKey();

        return is_int($key) ? $key : null;
    }
}
