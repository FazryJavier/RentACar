<?php

namespace App\Domain\Booking;

use App\Models\Setting;
use Database\Seeders\SettingsSeeder;

/**
 * Booking rules from the `settings` table (admin-editable later), with the seeded defaults as
 * fallback. Values are read once per instance and clamped to sane ranges.
 */
final class BookingSettings
{
    /** @var array<string, mixed>|null */
    private ?array $values = null;

    public function minLeadMinutes(): int
    {
        return $this->int('booking.min_lead_minutes', 0, 7 * 24 * 60);
    }

    public function maxAdvanceDays(): int
    {
        return $this->int('booking.max_advance_days', 1, 365);
    }

    public function minDays(): int
    {
        return $this->int('booking.min_days', 1, 365);
    }

    public function maxDays(): int
    {
        return max($this->minDays(), $this->int('booking.max_days', 1, 365));
    }

    public function prepBufferMinutes(): int
    {
        return $this->int('booking.prep_buffer_minutes', 0, 24 * 60);
    }

    private function int(string $key, int $min, int $max): int
    {
        $this->values ??= [
            ...SettingsSeeder::defaults(),
            ...Setting::query()->where('key', 'like', 'booking.%')->pluck('value', 'key')->all(),
        ];
        $value = $this->values[$key] ?? null;

        return is_numeric($value) ? max($min, min($max, (int) $value)) : $min;
    }
}
