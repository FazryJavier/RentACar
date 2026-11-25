<?php

namespace App\Domain\Auth\Exceptions;

use App\Exceptions\ApiRenderableWithHeaders;
use App\Exceptions\ErrorCatalog;
use App\Support\Http\ApiError;
use RuntimeException;

final class TooManyLoginAttempts extends RuntimeException implements ApiRenderableWithHeaders
{
    public function __construct(public readonly int $retryAfterSeconds)
    {
        parent::__construct(ErrorCatalog::message(ErrorCatalog::RATE_LIMITED));
    }

    public function apiStatus(): int
    {
        return 429;
    }

    public function apiMessage(): string
    {
        return ErrorCatalog::message(ErrorCatalog::RATE_LIMITED);
    }

    public function apiErrors(): array
    {
        return [new ApiError(null, ErrorCatalog::RATE_LIMITED, $this->apiMessage(), ['retry_after' => $this->retryAfterSeconds])];
    }

    public function apiHeaders(): array
    {
        return ['Retry-After' => (string) $this->retryAfterSeconds];
    }
}
