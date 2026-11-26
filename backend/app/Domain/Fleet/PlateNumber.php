<?php

namespace App\Domain\Fleet;

/**
 * Indonesian plate numbers: region code (1–2 letters), number (1–4 digits), optional suffix
 * (1–3 letters), stored upper case with single spaces, e.g. "b1234xyz" → "B 1234 XYZ".
 */
final class PlateNumber
{
    private const PATTERN = '/^([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{0,3})$/';

    /** The normalised plate, or null when the value is not a valid plate. */
    public static function normalize(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $compact = strtoupper(trim((string) preg_replace('/\s+/', ' ', $value)));

        if (preg_match(self::PATTERN, $compact, $parts) !== 1) {
            return null;
        }

        return trim("{$parts[1]} {$parts[2]} {$parts[3]}");
    }
}
