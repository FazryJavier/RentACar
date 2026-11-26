<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** A `Y-m-d` date that is not after today in WIB (Asia/Jakarta), whatever the server timezone. */
final class NotFutureWibDate implements ValidationRule
{
    public function __construct(private readonly string $message = 'Tanggal inspeksi tidak boleh di masa depan') {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && $value > now('Asia/Jakarta')->toDateString()) {
            $fail($this->message);
        }
    }
}
