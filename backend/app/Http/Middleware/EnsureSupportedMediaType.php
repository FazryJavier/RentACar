<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\UnsupportedMediaTypeHttpException;

/**
 * Requests that carry a body must use JSON, multipart, or form-urlencoded (415 otherwise).
 */
final class EnsureSupportedMediaType
{
    private const SUPPORTED = [
        'application/json',
        'multipart/form-data',
        'application/x-www-form-urlencoded',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->hasBody($request) && ! $this->isSupported($request)) {
            throw new UnsupportedMediaTypeHttpException;
        }

        return $next($request);
    }

    private function hasBody(Request $request): bool
    {
        if (in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return false;
        }

        $declared = $request->headers->get('Content-Length');

        return (is_numeric($declared) && (int) $declared > 0) || $request->getContent() !== '';
    }

    private function isSupported(Request $request): bool
    {
        $type = strtolower(trim(explode(';', (string) $request->headers->get('Content-Type'))[0]));

        return in_array($type, self::SUPPORTED, true) || str_ends_with($type, '+json');
    }
}
