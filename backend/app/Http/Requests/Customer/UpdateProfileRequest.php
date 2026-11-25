<?php

namespace App\Http\Requests\Customer;

use App\Domain\Customer\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if (is_string($this->input('name'))) {
            $data['name'] = trim($this->input('name'));
        }
        if (is_string($this->input('phone'))) {
            $data['phone'] = PhoneNumber::clean($this->input('phone'));
        }
        if (is_string($this->input('address'))) {
            $address = trim($this->input('address'));
            $data['address'] = $address === '' ? null : $address;
        }
        if (is_string($this->input('license_number'))) {
            $license = strtoupper(trim($this->input('license_number')));
            $data['license_number'] = $license === '' ? null : $license;
        }

        $this->merge($data);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', ...CustomerRules::name()],
            'phone' => ['sometimes', ...CustomerRules::phone()],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'license_number' => ['sometimes', 'nullable', 'string', 'regex:/^[A-Z0-9]{12,16}$/'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return CustomerRules::messages();
    }
}
