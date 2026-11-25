<?php

namespace App\Domain\Customer\Exceptions;

use App\Exceptions\ApiRenderable;
use App\Exceptions\ErrorCatalog;
use App\Support\Http\ApiError;
use RuntimeException;

final class AccountBlocked extends RuntimeException implements ApiRenderable
{
    public function __construct()
    {
        parent::__construct(ErrorCatalog::message(ErrorCatalog::ACCOUNT_BLOCKED));
    }

    public function apiStatus(): int
    {
        return 403;
    }

    public function apiMessage(): string
    {
        return ErrorCatalog::message(ErrorCatalog::ACCOUNT_BLOCKED);
    }

    public function apiErrors(): array
    {
        return [new ApiError(null, ErrorCatalog::ACCOUNT_BLOCKED, $this->apiMessage())];
    }
}
