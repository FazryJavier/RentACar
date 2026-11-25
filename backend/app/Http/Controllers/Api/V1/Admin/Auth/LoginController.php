<?php

namespace App\Http\Controllers\Api\V1\Admin\Auth;

use App\Domain\Admin\AuthenticateAdmin;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\LoginRequest;
use App\Http\Resources\AdminResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class LoginController extends Controller
{
    public function __invoke(LoginRequest $request, AuthenticateAdmin $authenticate): JsonResponse
    {
        $admin = $authenticate->attempt(
            $request,
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->boolean('remember'),
        );

        return ApiResponse::ok(AdminResource::make($admin->load('branch'))->resolve($request), 'Berhasil masuk.');
    }
}
