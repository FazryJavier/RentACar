<?php

namespace App\Exceptions;

use App\Support\Http\ApiError;
use RuntimeException;

/**
 * 422 with explicit error codes, for checks that do not go through Laravel's validator
 * (e.g. unknown filter keys in collection queries).
 */
final class ApiValidationException extends RuntimeException implements ApiRenderable
{
    /**
     * @param  list<ApiError>  $errors
     */
    public function __construct(private readonly array $errors)
    {
        parent::__construct(ErrorCatalog::message(ErrorCatalog::VALIDATION_FAILED));
    }

    public static function single(string $field, string $code, string $message): self
    {
        return new self([new ApiError($field, $code, $message)]);
    }

    public function apiStatus(): int
    {
        return 422;
    }

    public function apiMessage(): string
    {
        return ErrorCatalog::message(ErrorCatalog::VALIDATION_FAILED);
    }

    public function apiErrors(): array
    {
        return $this->errors;
    }
}
