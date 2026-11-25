<?php

use App\Http\Controllers\Api\V1\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\ResetPasswordController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Middleware\EnsureCustomerNotBlocked;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;

/*
| API routes are served under /api (see bootstrap/app.php).
| Every route is versioned: /api/v1/...
| Attach a named rate limiter to every route group: throttle:public|auth|customer|admin|...
*/

Route::prefix('v1')->name('api.v1.')->group(function (): void {
    Route::get('health', HealthController::class)
        ->middleware('throttle:public')
        ->name('health');

    // Customer authentication (guard `web`). Login counts failed attempts itself
    // (5 per minute per IP + email); `public` is only a coarse flood guard.
    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('register', RegisterController::class)->middleware('throttle:auth')->name('register');
        Route::post('login', LoginController::class)->middleware('throttle:public')->name('login');
        Route::post('forgot-password', ForgotPasswordController::class)->middleware('throttle:auth')->name('forgot-password');
        Route::post('reset-password', ResetPasswordController::class)->middleware('throttle:auth')->name('reset-password');
        Route::post('logout', LogoutController::class)
            ->middleware(['auth:web', AuthenticateSession::class, 'throttle:customer'])
            ->name('logout');
    });

    // Signed-in customer only. `auth:web` (not sanctum) so no other guard can satisfy it.
    Route::middleware(['auth:web', AuthenticateSession::class, EnsureCustomerNotBlocked::class, 'throttle:customer'])
        ->prefix('me')
        ->name('me.')
        ->group(function (): void {
            Route::get('/', [MeController::class, 'show'])->name('show');
            Route::patch('/', [MeController::class, 'update'])->name('update');
            Route::put('password', [MeController::class, 'password'])->name('password');
        });
});
