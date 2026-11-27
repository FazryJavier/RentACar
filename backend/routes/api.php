<?php

use App\Http\Controllers\Api\V1\Admin\Auth\ForgotPasswordController as AdminForgotPasswordController;
use App\Http\Controllers\Api\V1\Admin\Auth\LoginController as AdminLoginController;
use App\Http\Controllers\Api\V1\Admin\Auth\LogoutController as AdminLogoutController;
use App\Http\Controllers\Api\V1\Admin\Auth\ResetPasswordController as AdminResetPasswordController;
use App\Http\Controllers\Api\V1\Admin\Fleet\CarConditionController;
use App\Http\Controllers\Api\V1\Admin\Fleet\CarController;
use App\Http\Controllers\Api\V1\Admin\Fleet\CarInspectionController;
use App\Http\Controllers\Api\V1\Admin\Fleet\CarModelController;
use App\Http\Controllers\Api\V1\Admin\Fleet\CarPhotoController;
use App\Http\Controllers\Api\V1\Admin\MasterData\BranchController;
use App\Http\Controllers\Api\V1\Admin\MasterData\BrandController;
use App\Http\Controllers\Api\V1\Admin\MasterData\BrandLogoController;
use App\Http\Controllers\Api\V1\Admin\MasterData\CategoryController;
use App\Http\Controllers\Api\V1\Admin\MeController as AdminMeController;
use App\Http\Controllers\Api\V1\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\ResetPasswordController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\Public\PublicCarController;
use App\Http\Controllers\Api\V1\Public\PublicReferenceController;
use App\Http\Middleware\EnsureAdminActive;
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

    // Public catalog, availability and prices (no login). Rate limited per IP; date-independent
    // responses are briefly cacheable, everything with dates is `no-store`.
    Route::prefix('public')->name('public.')->middleware('throttle:public')->group(function (): void {
        Route::get('branches', [PublicReferenceController::class, 'branches'])->name('branches');
        Route::get('categories', [PublicReferenceController::class, 'categories'])->name('categories');
        Route::get('brands', [PublicReferenceController::class, 'brands'])->name('brands');
        Route::get('cars', [PublicCarController::class, 'index'])->name('cars.index');
        Route::get('cars/{slug}', [PublicCarController::class, 'show'])->name('cars.show');
        Route::get('cars/{slug}/availability', [PublicCarController::class, 'availability'])->name('cars.availability');
        Route::get('cars/{slug}/similar', [PublicCarController::class, 'similar'])->name('cars.similar');
    });

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

    // Admin panel (guard `admin`). Super Admin-only modules add `admin.role:super_admin`.
    Route::prefix('admin')->name('admin.')->group(function (): void {
        Route::prefix('auth')->name('auth.')->group(function (): void {
            Route::post('login', AdminLoginController::class)->middleware('throttle:public')->name('login');
            Route::post('forgot-password', AdminForgotPasswordController::class)->middleware('throttle:auth')->name('forgot-password');
            Route::post('reset-password', AdminResetPasswordController::class)->middleware('throttle:auth')->name('reset-password');
        });

        Route::middleware(['auth:admin', AuthenticateSession::class, EnsureAdminActive::class, 'throttle:admin'])->group(function (): void {
            Route::post('auth/logout', AdminLogoutController::class)->name('auth.logout');
            Route::get('me', [AdminMeController::class, 'show'])->name('me.show');
            Route::put('me/password', [AdminMeController::class, 'password'])->name('me.password');

            // Master data. Brands and categories: every admin. Branches: read for every admin,
            // write for Super Admin only.
            Route::apiResource('brands', BrandController::class)->except('update');
            Route::patch('brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
            Route::post('brands/{brand}/logo', [BrandLogoController::class, 'store'])->name('brands.logo.store');
            Route::delete('brands/{brand}/logo', [BrandLogoController::class, 'destroy'])->name('brands.logo.destroy');

            Route::apiResource('categories', CategoryController::class)->except('update');
            Route::patch('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');

            Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
            Route::get('branches/{branch}', [BranchController::class, 'show'])->name('branches.show');
            Route::middleware('admin.role:super_admin')->group(function (): void {
                Route::post('branches', [BranchController::class, 'store'])->name('branches.store');
                Route::patch('branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
                Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');
            });

            // Fleet: every admin; Staf only see and change cars of their branch (404 otherwise).
            Route::get('cars', [CarController::class, 'index'])->name('cars.index');
            Route::post('cars', [CarController::class, 'store'])->name('cars.store');
            Route::get('cars/{car}', [CarController::class, 'show'])->whereNumber('car')->name('cars.show');
            Route::patch('cars/{car}', [CarController::class, 'update'])->whereNumber('car')->name('cars.update');
            Route::delete('cars/{car}', [CarController::class, 'destroy'])->whereNumber('car')->name('cars.destroy');
            Route::post('cars/{car}/photos', [CarPhotoController::class, 'store'])->whereNumber('car')->name('cars.photos.store');
            Route::patch('cars/{car}/photos/order', [CarPhotoController::class, 'order'])->whereNumber('car')->name('cars.photos.order');
            Route::delete('cars/{car}/photos/{photo}', [CarPhotoController::class, 'destroy'])->whereNumber(['car', 'photo'])->name('cars.photos.destroy');

            // 3D model, condition markers and inspections (same branch rules as cars).
            Route::post('cars/{car}/model', [CarModelController::class, 'store'])->whereNumber('car')->name('cars.model.store');
            Route::patch('cars/{car}/model', [CarModelController::class, 'update'])->whereNumber('car')->name('cars.model.update');
            Route::delete('cars/{car}/model', [CarModelController::class, 'destroy'])->whereNumber('car')->name('cars.model.destroy');
            Route::post('cars/{car}/model/poster', [CarModelController::class, 'poster'])->whereNumber('car')->name('cars.model.poster');
            Route::get('cars/{car}/conditions', [CarConditionController::class, 'index'])->whereNumber('car')->name('cars.conditions.index');
            Route::post('cars/{car}/conditions', [CarConditionController::class, 'store'])->whereNumber('car')->name('cars.conditions.store');
            Route::patch('cars/{car}/conditions/{condition}', [CarConditionController::class, 'update'])->whereNumber(['car', 'condition'])->name('cars.conditions.update');
            Route::delete('cars/{car}/conditions/{condition}', [CarConditionController::class, 'destroy'])->whereNumber(['car', 'condition'])->name('cars.conditions.destroy');
            Route::post('cars/{car}/conditions/{condition}/photos', [CarConditionController::class, 'storePhoto'])->whereNumber(['car', 'condition'])->name('cars.conditions.photos.store');
            Route::delete('cars/{car}/conditions/{condition}/photos/{photo}', [CarConditionController::class, 'destroyPhoto'])->whereNumber(['car', 'condition', 'photo'])->name('cars.conditions.photos.destroy');
            Route::get('cars/{car}/inspections', [CarInspectionController::class, 'index'])->whereNumber('car')->name('cars.inspections.index');
            Route::post('cars/{car}/inspections', [CarInspectionController::class, 'store'])->whereNumber('car')->name('cars.inspections.store');
        });
    });
});
