<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gives every request an id (client UUID reused, otherwise generated), adds it to all
 * log entries and returns it in the X-Request-Id response header — including errors.
 */
final class AssignRequestId
{
    public const HEADER = 'X-Request-Id';

    public const ATTRIBUTE = 'request_id';

    public function handle(Request $request, Closure $next): Response
    {
        $incoming = $request->headers->get(self::HEADER);
        $requestId = is_string($incoming) && Str::isUuid($incoming)
            ? strtolower($incoming)
            : (string) Str::uuid();

        $request->attributes->set(self::ATTRIBUTE, $requestId);
        $request->headers->set(self::HEADER, $requestId);
        Log::withContext([self::ATTRIBUTE => $requestId]);

        /** @var Response $response */
        $response = $next($request);
        $response->headers->set(self::HEADER, $requestId);

        return $response;
    }
}
