<?php

namespace App\Domain\Admin\MasterData;

use App\Exceptions\ApiRenderable;
use App\Exceptions\ErrorCatalog;
use App\Support\Http\ApiError;
use RuntimeException;

/** The record changed since the admin loaded it (optimistic locking). */
final class VersionConflict extends RuntimeException implements ApiRenderable
{
    public function __construct()
    {
        parent::__construct(ErrorCatalog::message(ErrorCatalog::VERSION_CONFLICT));
    }

    public function apiStatus(): int
    {
        return 409;
    }

    public function apiMessage(): string
    {
        return ErrorCatalog::message(ErrorCatalog::VERSION_CONFLICT);
    }

    public function apiErrors(): array
    {
        return [new ApiError('version', ErrorCatalog::VERSION_CONFLICT, $this->apiMessage())];
    }
}
