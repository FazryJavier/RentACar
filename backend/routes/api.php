<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
| API routes are served under /api (see bootstrap/app.php).
| Every route is versioned: /api/v1/...
| Attach a named rate limiter to every route group: throttle:public|auth|customer|admin|...
*/

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', HealthController::class)
        ->middleware('throttle:public')
        ->name('health');
});
