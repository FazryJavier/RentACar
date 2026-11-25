<?php

namespace App\Http\Controllers\Api\V1\Admin\Auth;

use App\Http\Controllers\Api\V1\Auth\ForgotPasswordController as CustomerForgotPassword;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ForgotPasswordRequest;
use App\Models\Admin;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

final class ForgotPasswordController extends Controller
{
    public function __invoke(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();

        // Only active admins receive a link; the response never reveals whether one was sent.
        $active = Admin::query()->whereRaw('lower(email) = ?', [$email])->where('is_active', true)->exists();
        if ($active) {
            Password::broker('admins')->sendResetLink(['email' => $email]);
        }

        return ApiResponse::ok(null, CustomerForgotPassword::MESSAGE);
    }
}
