<?php

namespace App\Domain\Admin\MasterData;

use App\Exceptions\ApiRenderable;
use App\Exceptions\ErrorCatalog;
use App\Support\Http\ApiError;
use RuntimeException;

/** The record is still referenced and cannot be deleted. */
final class ResourceInUse extends RuntimeException implements ApiRenderable
{
    /**
     * @param  array<string, int>  $usage  e.g. ['cars' => 3]
     */
    public function __construct(string $message, public readonly array $usage)
    {
        parent::__construct($message);
    }

    public function apiStatus(): int
    {
        return 409;
    }

    public function apiMessage(): string
    {
        return $this->getMessage();
    }

    public function apiErrors(): array
    {
        return [new ApiError(null, ErrorCatalog::RESOURCE_IN_USE, $this->getMessage(), ['usage' => $this->usage])];
    }
}
