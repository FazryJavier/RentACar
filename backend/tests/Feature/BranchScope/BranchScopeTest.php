<?php

use App\Domain\Admin\AdminSession;
use App\Http\Middleware\EnsureAdminActive;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Customer;
use App\Support\ApiResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Tests\Support\Browser;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->branchA = Branch::factory()->create();
    $this->branchB = Branch::factory()->create();
    $this->staffA = Admin::factory()->staff($this->branchA)->create(['password' => 'rahasia123']);
    $this->superAdmin = Admin::factory()->superAdmin()->create(['password' => 'rahasia123']);

    // Test-only routes that use the building blocks the admin modules will use.
    Route::middleware(['api', 'auth:admin', AuthenticateSession::class, EnsureAdminActive::class])
        ->prefix('api/v1/admin/_test')
        ->group(function (): void {
            Route::get('cars/{id}', function (Request $request, string $id) {
                $admin = $request->user(AdminSession::GUARD);

                return ApiResponse::ok(['id' => Car::findVisibleOrFail($id, $admin)->id]);
            });
            Route::get('super', fn () => ApiResponse::ok(['ok' => true]))->middleware('admin.role:super_admin');
        });
});

function adminBrowser(TestCase $test, Admin $admin): Browser
{
    $browser = new Browser($test);
    $browser->post('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => 'rahasia123'])->assertOk();

    return $browser;
}

it('lets Staf see only their branch', function () {
    $carA = Car::factory()->create(['branch_id' => $this->branchA->id]);
    Car::factory()->create(['branch_id' => $this->branchB->id]);

    expect(Car::query()->visibleTo($this->staffA)->pluck('id')->all())->toBe([$carA->id])
        ->and(Car::query()->visibleTo($this->superAdmin)->count())->toBe(2);
});

it('scopes bookings by pickup branch', function () {
    Booking::factory()->create(['branch_id' => $this->branchA->id]);
    Booking::factory()->create(['branch_id' => $this->branchB->id]);

    expect(Booking::query()->visibleTo($this->staffA)->count())->toBe(1)
        ->and(Booking::query()->visibleTo($this->superAdmin)->count())->toBe(2);
});

it('answers 404 for another branch exactly like a missing id', function () {
    $carA = Car::factory()->create(['branch_id' => $this->branchA->id]);
    $carB = Car::factory()->create(['branch_id' => $this->branchB->id]);
    $browser = adminBrowser($this, $this->staffA);

    $browser->get("/api/v1/admin/_test/cars/{$carA->id}")->assertOk();
    $other = $browser->get("/api/v1/admin/_test/cars/{$carB->id}")->assertNotFound();
    $missing = $browser->get('/api/v1/admin/_test/cars/999999')->assertNotFound();

    expect($other->json())->toBe($missing->json())
        ->and($other->json('errors.0.code'))->toBe('not_found');
    adminBrowser($this, $this->superAdmin)->get("/api/v1/admin/_test/cars/{$carB->id}")->assertOk();
});

it('restricts Super Admin routes', function () {
    adminBrowser($this, $this->staffA)->get('/api/v1/admin/_test/super')->assertForbidden()->assertJsonPath('errors.0.code', 'forbidden');
    adminBrowser($this, $this->superAdmin)->get('/api/v1/admin/_test/super')->assertOk();

    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    $browser = new Browser($this);
    $browser->post('/api/v1/auth/login', ['email' => $customer->email, 'password' => 'rahasia123'])->assertOk();
    $browser->get('/api/v1/admin/_test/super')->assertUnauthorized();
});
