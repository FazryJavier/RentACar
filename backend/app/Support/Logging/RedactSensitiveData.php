<?php

namespace App\Support\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * Replaces sensitive values in log context/extra with [REDACTED], at any depth.
 */
final class RedactSensitiveData implements ProcessorInterface
{
    public const MASK = '[REDACTED]';

    /** Exact keys (compared case-insensitively). */
    private const KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'authorization',
        'cookie',
        'set-cookie',
        'license_number',
        'renter_license_number',
        'device_token',
        'secret',
    ];

    public function __invoke(LogRecord $record): LogRecord
    {
        return $record->with(
            context: $this->redact($record->context),
            extra: $this->redact($record->extra),
        );
    }

    /**
     * @param  array<mixed>  $data
     * @return array<mixed>
     */
    public function redact(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && $this->isSensitive($key)) {
                $data[$key] = self::MASK;

                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->redact($value);
            }
        }

        return $data;
    }

    private function isSensitive(string $key): bool
    {
        $key = strtolower($key);

        return in_array($key, self::KEYS, true)
            || str_ends_with($key, '_token')
            || str_ends_with($key, '-token')
            || str_starts_with($key, 'password');
    }
}
