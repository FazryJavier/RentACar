<?php

namespace App\Http\Controllers\Api\V1\Public;

use Illuminate\Http\JsonResponse;

/** Cache headers for public catalog responses (API spec §4.5). */
trait PublicCache
{
    /** Shared caches may keep date-independent catalog data briefly; anything with dates stays `no-store`. */
    protected function cacheable(JsonResponse $response): JsonResponse
    {
        return $response->header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
}
