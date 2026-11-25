<?php

namespace App\Http\Requests\Customer;

use App\Domain\Customer\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(array_filter([
            'email' => CustomerRules::normalizeEmail($this->input('email')),
            'phone' => is_string($this->input('phone')) ? PhoneNumber::clean($this->input('phone')) : $this->input('phone'),
            'name' => is_string($this->input('name')) ? trim($this->input('name')) : $this->input('name'),
        ], static fn (mixed $value): bool => $value !== null));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => CustomerRules::name(),
            'email' => CustomerRules::newEmail(),
            'phone' => CustomerRules::phone(),
            'password' => CustomerRules::newPassword(),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return CustomerRules::messages();
    }
}
