<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Health\HealthChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

/**
 * Public liveness/readiness endpoint used by CI smoke checks and deploy health checks.
 *
 * The response follows the project envelope {code, success, message, data, errors, meta}.
 * It is built inline here; US-02 moves it onto the shared ApiResponse helper.
 */
class HealthController extends Controller
{
    public function __invoke(HealthChecker $checker): JsonResponse
    {
        $checks = $checker->check();

        if ($checker->isHealthy($checks)) {
            return response()->json([
                'code' => 200,
                'success' => true,
                'message' => 'Layanan berjalan normal.',
                'data' => [
                    'status' => HealthChecker::OK,
                    'checks' => $checks,
                    'time' => Carbon::now('UTC')->format('Y-m-d\TH:i:s\Z'),
                ],
                'errors' => null,
                'meta' => null,
            ], 200);
        }

        return response()->json([
            'code' => 503,
            'success' => false,
            'message' => 'Layanan sedang tidak tersedia.',
            'data' => null,
            'errors' => [[
                'field' => null,
                'code' => 'service_unavailable',
                'message' => 'Satu atau lebih dependensi tidak dapat dihubungi.',
                'details' => $checks,
            ]],
            'meta' => null,
        ], 503);
    }
}
