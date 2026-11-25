<?php

namespace App\Http\Requests\Customer;

use App\Domain\Customer\PhoneNumber;
use Illuminate\Validation\Rule;

/**
 * Field rules and messages shared by the customer Form Requests (FRD F-06 / F-03).
 */
final class CustomerRules
{
    public const NAME_MESSAGE = 'Nama wajib diisi (2–100 karakter)';

    public const EMAIL_MESSAGE = 'Email tidak valid';

    public const EMAIL_TAKEN_MESSAGE = 'Email sudah terdaftar';

    public const PHONE_MESSAGE = 'Nomor HP tidak valid';

    public const PASSWORD_MESSAGE = 'Kata sandi minimal 8 karakter berisi huruf dan angka';

    public const PASSWORD_CONFIRMATION_MESSAGE = 'Konfirmasi kata sandi tidak cocok';

    public const PASSWORD_SAME_AS_EMAIL_MESSAGE = 'Kata sandi tidak boleh sama dengan email';

    public const LICENSE_MESSAGE = 'Nomor SIM tidak valid';

    public const ADDRESS_MESSAGE = 'Alamat maksimal 255 karakter';

    /** @return list<string> */
    public static function name(): array
    {
        return ['bail', 'required', 'string', 'min:2', 'max:100'];
    }

    /** @return list<mixed> */
    public static function newEmail(): array
    {
        return ['bail', 'required', 'string', 'max:254', 'email:rfc', Rule::unique('customers', 'email')->whereNull('deleted_at')];
    }

    /** @return list<string> */
    public static function phone(): array
    {
        return ['bail', 'required', 'string', 'regex:'.PhoneNumber::PATTERN];
    }

    /**
     * New password: 8–72 characters, at least one letter and one digit, confirmed.
     *
     * @return list<string>
     */
    public static function newPassword(?string $differentFrom = 'email'): array
    {
        $rules = ['bail', 'required', 'string', 'min:8', 'max:72', 'regex:/[A-Za-z]/', 'regex:/\d/', 'confirmed'];

        if ($differentFrom !== null) {
            $rules[] = 'different:'.$differentFrom;
        }

        return $rules;
    }

    /** @return array<string, string> */
    public static function messages(string $passwordField = 'password'): array
    {
        return [
            'name.*' => self::NAME_MESSAGE,
            'email.unique' => self::EMAIL_TAKEN_MESSAGE,
            'email.*' => self::EMAIL_MESSAGE,
            'phone.*' => self::PHONE_MESSAGE,
            $passwordField.'.confirmed' => self::PASSWORD_CONFIRMATION_MESSAGE,
            $passwordField.'.different' => self::PASSWORD_SAME_AS_EMAIL_MESSAGE,
            $passwordField.'.*' => self::PASSWORD_MESSAGE,
            'address.*' => self::ADDRESS_MESSAGE,
            'license_number.*' => self::LICENSE_MESSAGE,
        ];
    }

    public static function normalizeEmail(mixed $value): mixed
    {
        return is_string($value) ? mb_strtolower(trim($value)) : $value;
    }
}
