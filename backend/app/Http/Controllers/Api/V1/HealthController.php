<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ErrorCatalog;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use App\Support\Health\HealthChecker;
use App\Support\Http\ApiError;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Public liveness/readiness endpoint used by CI smoke checks and deploy health checks.
 */
class HealthController extends Controller
{
    /**
     * Health status of the API and its dependencies.
     *
     * Returns 200 when the database and cache store respond, 503 with per-check details otherwise.
     *
     * @unauthenticated
     */
    public function __invoke(HealthChecker $checker): JsonResponse
    {
        $checks = $checker->check();

        if ($checker->isHealthy($checks)) {
            return ApiResponse::ok([
                'status' => HealthChecker::OK,
                'checks' => $checks,
                'time' => Carbon::now('UTC')->format('Y-m-d\TH:i:s\Z'),
            ], 'Layanan berjalan normal.');
        }

        $message = ErrorCatalog::message(ErrorCatalog::SERVICE_UNAVAILABLE);

        return ApiResponse::error(503, $message, [
            new ApiError(null, ErrorCatalog::SERVICE_UNAVAILABLE, 'Satu atau lebih dependensi tidak dapat dihubungi.', $checks),
        ]);
    }
}
