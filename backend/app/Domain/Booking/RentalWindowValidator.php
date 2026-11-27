<?php

namespace App\Domain\Booking;

use App\Exceptions\ApiValidationException;
use App\Models\Branch;
use App\Support\Http\ApiError;
use Carbon\CarbonImmutable;
use Throwable;

/**
 * Validates a rental window (FRD F-01): lead time, advance limit, 30-minute slots, branch
 * operating hours and duration. Clock rules are evaluated in WIB; values are kept in UTC.
 */
final class RentalWindowValidator
{
    public const TIMEZONE = 'Asia/Jakarta';

    /** ISO 8601 date-time with optional seconds and optional offset (no offset = WIB). */
    private const FORMAT = '/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/';

    public function __construct(private readonly BookingSettings $settings) {}

    /**
     * @param  array{pickup_at?: mixed, return_at?: mixed}  $input
     *
     * @throws ApiValidationException
     */
    public function validate(array $input, ?Branch $branch, ?CarbonImmutable $now = null): RentalWindow
    {
        $now ??= CarbonImmutable::now();
        $errors = [];

        if ($branch === null) {
            $errors['branch'] = new ApiError('branch', 'required', 'Pilih cabang');
        }

        $pickup = $this->parse($input['pickup_at'] ?? null, 'pickup_at', 'Isi waktu ambil', $errors);
        $return = $this->parse($input['return_at'] ?? null, 'return_at', 'Isi waktu kembali', $errors);

        if ($pickup !== null) {
            $this->checkPickup($pickup, $now, $errors);
        }
        foreach (['pickup_at' => $pickup, 'return_at' => $return] as $field => $time) {
            if ($time !== null && ! isset($errors[$field])) {
                $this->checkSlot($time, $field, $branch, $errors);
            }
        }
        if ($pickup !== null && $return !== null && ! isset($errors['return_at'])) {
            $this->checkDuration($pickup, $return, $errors);
        }

        if ($errors !== [] || $pickup === null || $return === null) {
            throw new ApiValidationException(array_values($errors));
        }

        return new RentalWindow($pickup, $return);
    }

    /**
     * @param  array<string, ApiError>  $errors
     */
    private function parse(mixed $value, string $field, string $requiredMessage, array &$errors): ?CarbonImmutable
    {
        if ($value === null || $value === '') {
            $errors[$field] = new ApiError($field, 'required', $requiredMessage);

            return null;
        }

        if (! is_string($value) || preg_match(self::FORMAT, trim($value)) !== 1) {
            $errors[$field] = new ApiError($field, 'invalid_format', 'Format waktu tidak valid');

            return null;
        }

        try {
            return CarbonImmutable::parse(trim($value), self::TIMEZONE)->utc();
        } catch (Throwable) {
            $errors[$field] = new ApiError($field, 'invalid_format', 'Format waktu tidak valid');

            return null;
        }
    }

    /**
     * @param  array<string, ApiError>  $errors
     */
    private function checkPickup(CarbonImmutable $pickup, CarbonImmutable $now, array &$errors): void
    {
        if ($pickup->lt($now->addMinutes($this->settings->minLeadMinutes()))) {
            $hours = intdiv($this->settings->minLeadMinutes(), 60);
            $errors['pickup_at'] = new ApiError('pickup_at', 'too_soon', "Waktu ambil minimal {$hours} jam dari sekarang");
        } elseif ($pickup->gt($now->addDays($this->settings->maxAdvanceDays()))) {
            $errors['pickup_at'] = new ApiError('pickup_at', 'too_far', "Waktu ambil maksimal {$this->settings->maxAdvanceDays()} hari dari sekarang");
        }
    }

    /**
     * @param  array<string, ApiError>  $errors
     */
    private function checkSlot(CarbonImmutable $time, string $field, ?Branch $branch, array &$errors): void
    {
        $local = $time->setTimezone(self::TIMEZONE);

        if (! in_array($local->minute, [0, 30], true) || $local->second !== 0 || $local->microsecond !== 0) {
            $errors[$field] = new ApiError($field, 'invalid_slot', 'Pilih jam dengan kelipatan 30 menit');

            return;
        }

        if ($branch !== null) {
            $clock = $local->format('H:i');
            $opening = substr((string) $branch->opening_time, 0, 5);
            $closing = substr((string) $branch->closing_time, 0, 5);
            if ($clock < $opening || $clock > $closing) {
                $errors[$field] = new ApiError($field, 'outside_operating_hours', "Pilih jam dalam jam operasional cabang ({$opening}–{$closing} WIB)");
            }
        }
    }

    /**
     * @param  array<string, ApiError>  $errors
     */
    private function checkDuration(CarbonImmutable $pickup, CarbonImmutable $return, array &$errors): void
    {
        $minutes = $return->gt($pickup) ? (int) $pickup->diffInMinutes($return) : 0;
        $min = $this->settings->minDays() * 1440;
        $max = $this->settings->maxDays() * 1440;

        if ($minutes < $min || $minutes > $max) {
            $errors['return_at'] = new ApiError(
                'return_at',
                'duration_out_of_range',
                "Durasi sewa {$this->settings->minDays()}–{$this->settings->maxDays()} hari",
            );
        }
    }
}
