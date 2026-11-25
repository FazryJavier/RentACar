<?php

namespace App\Domain\Customer;

/**
 * Indonesian mobile numbers: accepted as 08…, 62… or +62… (10–15 digits), stored as 62….
 */
final class PhoneNumber
{
    /** 08 + 8–13 digits, or (+)62 8 + 7–12 digits: 10–15 digits in total. */
    public const PATTERN = '/^(?:08\d{8,13}|\+?628\d{7,12})$/';

    /** Removes spaces, dashes, dots and brackets people type for readability. */
    public static function clean(string $value): string
    {
        return (string) preg_replace('/[\s\-.()]/', '', trim($value));
    }

    public static function normalize(string $value): string
    {
        $clean = self::clean($value);

        if (str_starts_with($clean, '+')) {
            $clean = substr($clean, 1);
        }

        if (str_starts_with($clean, '0')) {
            return '62'.substr($clean, 1);
        }

        return $clean;
    }
}
