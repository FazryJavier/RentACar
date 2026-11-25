<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => CustomerRules::normalizeEmail($this->input('email'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'max:255'],
            'email' => ['bail', 'required', 'string', 'max:254', 'email:rfc'],
            'password' => CustomerRules::newPassword(),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [...CustomerRules::messages(), 'token.*' => 'Tautan atur ulang tidak valid atau sudah kedaluwarsa.'];
    }
}
