<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Customer\ResetCustomerPassword;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ResetPasswordRequest;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class ResetPasswordController extends Controller
{
    public function __invoke(ResetPasswordRequest $request, ResetCustomerPassword $reset): JsonResponse
    {
        $reset->handle(
            $request->string('email')->toString(),
            $request->string('token')->toString(),
            $request->string('password')->toString(),
            $request->ip(),
        );

        return ApiResponse::ok(null, 'Kata sandi berhasil diatur ulang. Silakan masuk.');
    }
}
