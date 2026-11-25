<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
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
        return ['email' => ['bail', 'required', 'string', 'max:254', 'email:rfc']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['email.*' => CustomerRules::EMAIL_MESSAGE];
    }
}
