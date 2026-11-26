<?php

namespace App\Rules;

use App\Domain\Fleet\PlateNumber;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** Accepts Indonesian plate numbers such as "B 1234 XYZ" (see PlateNumber). */
final class PlateNumberRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || PlateNumber::normalize($value) === null) {
            $fail('Format plat nomor tidak valid (contoh B 1234 XYZ).');
        }
    }
}
