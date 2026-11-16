<?php

namespace App\Exceptions;

use App\Support\Http\ApiError;

/**
 * Implemented by domain exceptions that know their own API status, message and errors
 * (e.g. a future CarUnavailableException → 409 car_unavailable).
 */
interface ApiRenderable
{
    public function apiStatus(): int;

    public function apiMessage(): string;

    /**
     * @return list<ApiError>
     */
    public function apiErrors(): array;
}
