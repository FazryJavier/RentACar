<?php

namespace App\Domain\Catalog;

use App\Domain\Booking\BookingSettings;
use App\Models\Setting;
use Database\Seeders\SettingsSeeder;

/**
 * Settings that the public website may read. An explicit allowlist: anything else in the
 * `settings` table (bank account, internal limits) is never exposed.
 */
final class PublicSettings
{
    private const TERMS_MAX_LENGTH = 50_000;

    public function __construct(private readonly BookingSettings $booking) {}

    /**
     * @return array{
     *     booking: array{min_days: int, max_days: int, min_lead_minutes: int, max_advance_days: int, payment_window_minutes: int},
     *     gps: array{retention_days: int},
     *     content: array{terms_markdown: string},
     * }
     */
    public function values(): array
    {
        $stored = Setting::query()
            ->whereIn('key', ['booking.payment_window_minutes', 'gps.retention_days', 'content.terms_markdown'])
            ->pluck('value', 'key')
            ->all();
        $values = [...SettingsSeeder::defaults(), ...$stored];

        return [
            'booking' => [
                'min_days' => $this->booking->minDays(),
                'max_days' => $this->booking->maxDays(),
                'min_lead_minutes' => $this->booking->minLeadMinutes(),
                'max_advance_days' => $this->booking->maxAdvanceDays(),
                'payment_window_minutes' => self::clamp($values['booking.payment_window_minutes'], 5, 24 * 60, 120),
            ],
            'gps' => [
                'retention_days' => self::clamp($values['gps.retention_days'], 1, 365, 90),
            ],
            'content' => [
                'terms_markdown' => self::terms($values['content.terms_markdown']),
            ],
        ];
    }

    private static function clamp(mixed $value, int $min, int $max, int $fallback): int
    {
        return is_numeric($value) ? max($min, min($max, (int) $value)) : $fallback;
    }

    private static function terms(mixed $value): string
    {
        $text = is_string($value) ? $value : (string) SettingsSeeder::defaults()['content.terms_markdown'];

        return mb_substr($text, 0, self::TERMS_MAX_LENGTH);
    }
}
