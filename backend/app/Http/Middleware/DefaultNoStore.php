<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * API responses are not cacheable unless a route explicitly opts in
 * (e.g. with the `cache.headers:public;max_age=60` middleware).
 */
final class DefaultNoStore
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $headers = $response->headers;
        $routeChoseCaching = $headers->hasCacheControlDirective('public')
            || $headers->hasCacheControlDirective('max-age')
            || $headers->hasCacheControlDirective('s-maxage');

        if (! $routeChoseCaching) {
            $headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
