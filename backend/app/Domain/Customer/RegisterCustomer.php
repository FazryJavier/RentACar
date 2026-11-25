<?php

namespace App\Domain\Customer;

use App\Http\Requests\Customer\CustomerRules;
use App\Models\Customer;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Creates a customer account. Email is stored lowercased; phone as 62….
 */
final class RegisterCustomer
{
    /**
     * @param  array{name: string, email: string, phone: string, password: string}  $data
     *
     * @throws ValidationException when the email is taken (including a concurrent registration)
     */
    public function handle(array $data): Customer
    {
        try {
            return DB::transaction(fn (): Customer => Customer::query()->create([
                'name' => $data['name'],
                'email' => mb_strtolower(trim($data['email'])),
                'phone' => PhoneNumber::normalize($data['phone']),
                'password' => $data['password'],
            ]));
        } catch (UniqueConstraintViolationException) {
            // The lower(email) unique index caught a registration that passed validation concurrently.
            throw ValidationException::withMessages(['email' => CustomerRules::EMAIL_TAKEN_MESSAGE])
                ->errorBag('default');
        }
    }
}
