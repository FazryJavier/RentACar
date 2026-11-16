<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Rejects non-multipart request bodies (JSON / form-urlencoded) above a size limit with 413.
 * File uploads use multipart/form-data and are limited by per-endpoint validation rules.
 *
 * Usage: `limit_body` (default 256 KB) or `limit_body:65536` for a stricter route.
 */
final class LimitJsonBody
{
    public const DEFAULT_MAX_BYTES = 262_144;

    public function handle(Request $request, Closure $next, ?string $maxBytes = null): Response
    {
        $limit = $maxBytes !== null ? (int) $maxBytes : self::DEFAULT_MAX_BYTES;

        if (! $this->isMultipart($request) && $this->bodySize($request) > $limit) {
            throw new HttpException(413);
        }

        return $next($request);
    }

    private function isMultipart(Request $request): bool
    {
        return str_starts_with(strtolower((string) $request->headers->get('Content-Type')), 'multipart/');
    }

    private function bodySize(Request $request): int
    {
        $declared = $request->headers->get('Content-Length');

        if (is_numeric($declared) && (int) $declared > 0) {
            return (int) $declared;
        }

        return strlen((string) $request->getContent());
    }
}
