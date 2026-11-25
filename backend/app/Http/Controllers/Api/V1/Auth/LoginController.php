<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Customer\AuthenticateCustomer;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\LoginRequest;
use App\Http\Resources\CustomerResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class LoginController extends Controller
{
    public function __invoke(LoginRequest $request, AuthenticateCustomer $authenticate): JsonResponse
    {
        $customer = $authenticate->attempt(
            $request,
            $request->string('email')->toString(),
            $request->string('password')->toString(),
            $request->boolean('remember'),
        );

        return ApiResponse::ok(CustomerResource::make($customer)->resolve($request), 'Berhasil masuk.');
    }
}
