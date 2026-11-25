<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Customer\CustomerSession;
use App\Domain\Customer\RegisterCustomer;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\RegisterRequest;
use App\Http\Resources\CustomerResource;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

final class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, RegisterCustomer $register, CustomerSession $session): JsonResponse
    {
        /** @var array{name: string, email: string, phone: string, password: string} $data */
        $data = $request->safe()->only(['name', 'email', 'phone', 'password']);

        $customer = $register->handle($data);
        $session->start($request, $customer);

        return ApiResponse::created(CustomerResource::make($customer)->resolve($request), 'Akun berhasil dibuat.');
    }
}
