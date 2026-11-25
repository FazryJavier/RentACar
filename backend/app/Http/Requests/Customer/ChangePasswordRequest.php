<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public const WRONG_CURRENT_MESSAGE = 'Kata sandi lama salah';

    public const SAME_AS_CURRENT_MESSAGE = 'Kata sandi baru harus berbeda dari kata sandi lama';

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'max:255'],
            'password' => [...CustomerRules::newPassword(null), 'different:current_password'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'current_password.*' => self::WRONG_CURRENT_MESSAGE,
            'password.different' => self::SAME_AS_CURRENT_MESSAGE,
            ...CustomerRules::messages(),
        ];
    }
}
