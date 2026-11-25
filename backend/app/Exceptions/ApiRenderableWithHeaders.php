<?php

namespace App\Exceptions;

/**
 * An ApiRenderable exception that also sets response headers (e.g. Retry-After on 429).
 */
interface ApiRenderableWithHeaders extends ApiRenderable
{
    /**
     * @return array<string, string>
     */
    public function apiHeaders(): array;
}
