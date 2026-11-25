<?php

namespace App\Http\Controllers\Api\V1\Admin\Auth;

use App\Domain\Auth\ResetPasswordWithBroker;
use App\Enums\ActorType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetPasswordRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class ResetPasswordController extends Controller
{
    public function __invoke(ResetPasswordRequest $request, ResetPasswordWithBroker $reset): JsonResponse
    {
        $reset->handle(
            'admins',
            ActorType::Admin,
            'admin.password_reset',
            $request->string('email')->toString(),
            $request->string('token')->toString(),
            $request->string('password')->toString(),
            $request->ip(),
        );

        return ApiResponse::ok(null, 'Kata sandi berhasil diatur ulang. Silakan masuk.');
    }
}
