<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Customer\CustomerSession;
use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class LogoutController extends Controller
{
    public function __invoke(Request $request, CustomerSession $session): JsonResponse
    {
        $session->end($request);

        return ApiResponse::ok(null, 'Berhasil keluar.');
    }
}
