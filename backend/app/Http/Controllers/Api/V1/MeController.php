<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Customer\ChangePassword;
use App\Domain\Customer\CustomerSession;
use App\Domain\Customer\PhoneNumber;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ChangePasswordRequest;
use App\Http\Requests\Customer\UpdateProfileRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The signed-in customer's own profile. Never takes a customer id from the request.
 */
final class MeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return ApiResponse::ok(CustomerResource::make($this->customer($request))->resolve($request), 'Profil berhasil diambil.');
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $customer = $this->customer($request);
        $data = $request->safe()->only(['name', 'phone', 'address', 'license_number']);

        if (isset($data['phone']) && is_string($data['phone'])) {
            $data['phone'] = PhoneNumber::normalize($data['phone']);
        }

        $customer->fill($data);
        if ($customer->isDirty()) {
            $customer->version++;
            $customer->save();
        }

        return ApiResponse::ok(CustomerResource::make($customer)->resolve($request), 'Profil berhasil diperbarui.');
    }

    public function password(ChangePasswordRequest $request, ChangePassword $change): JsonResponse
    {
        $change->handle(
            $request,
            $this->customer($request),
            $request->string('current_password')->toString(),
            $request->string('password')->toString(),
        );

        return ApiResponse::ok(null, 'Kata sandi berhasil diubah.');
    }

    private function customer(Request $request): Customer
    {
        $customer = $request->user(CustomerSession::GUARD);
        assert($customer instanceof Customer);

        return $customer;
    }
}
