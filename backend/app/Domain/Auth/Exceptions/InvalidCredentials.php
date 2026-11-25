<?php

namespace App\Domain\Auth\Exceptions;

use App\Exceptions\ApiRenderable;
use App\Exceptions\ErrorCatalog;
use App\Support\Http\ApiError;
use RuntimeException;

/**
 * Wrong email or password. The message never says which of the two was wrong.
 */
final class InvalidCredentials extends RuntimeException implements ApiRenderable
{
    public const MESSAGE = 'Email atau kata sandi salah.';

    public function __construct()
    {
        parent::__construct(self::MESSAGE);
    }

    public function apiStatus(): int
    {
        return 401;
    }

    public function apiMessage(): string
    {
        return self::MESSAGE;
    }

    public function apiErrors(): array
    {
        return [new ApiError(null, ErrorCatalog::UNAUTHENTICATED, self::MESSAGE)];
    }
}
