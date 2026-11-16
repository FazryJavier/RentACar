<?php

namespace App\Http\Middleware;

use App\Exceptions\MalformedJsonException;
use Closure;
use Illuminate\Http\Request;
use JsonException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Laravel silently treats an invalid JSON body as empty input; reject it with 400 instead.
 */
final class RejectMalformedJson
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isJson()) {
            $content = (string) $request->getContent();

            if (trim($content) !== '') {
                try {
                    json_decode($content, flags: JSON_THROW_ON_ERROR);
                } catch (JsonException) {
                    throw new MalformedJsonException;
                }
            }
        }

        return $next($request);
    }
}
