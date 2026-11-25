<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ForgotPasswordRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

final class ForgotPasswordController extends Controller
{
    public const MESSAGE = 'Jika email terdaftar, tautan atur ulang telah dikirim.';

    public function __invoke(ForgotPasswordRequest $request): JsonResponse
    {
        // The broker's status (sent, unknown user, throttled) is deliberately ignored: the
        // response must not reveal whether the email is registered.
        Password::broker('customers')->sendResetLink(['email' => $request->string('email')->toString()]);

        return ApiResponse::ok(null, self::MESSAGE);
    }
}
