<?php

use App\Models\Admin;
use App\Models\Branch;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

it('rejects guests and customer sessions on admin routes', function () {
    (new Browser($this))->get('/api/v1/admin/me')->assertUnauthorized()->assertJsonPath('errors.0.code', 'unauthenticated');

    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    $browser = new Browser($this);
    $browser->post('/api/v1/auth/login', ['email' => $customer->email, 'password' => 'rahasia123'])->assertOk();

    $browser->get('/api/v1/admin/me')->assertUnauthorized();
});

it('rejects admin sessions on customer routes', function () {
    $admin = Admin::factory()->superAdmin()->create(['password' => 'rahasia123']);
    $browser = new Browser($this);
    $browser->post('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => 'rahasia123'])->assertOk();

    $browser->get('/api/v1/me')->assertUnauthorized();
});

it('ends the session of an admin deactivated while signed in', function () {
    $staff = Admin::factory()->staff()->create(['password' => 'rahasia123']);
    $browser = new Browser($this);
    $browser->post('/api/v1/admin/auth/login', ['email' => $staff->email, 'password' => 'rahasia123'])->assertOk();

    $staff->update(['is_active' => false]);

    $browser->get('/api/v1/admin/me')->assertForbidden()->assertJsonPath('errors.0.code', 'account_blocked');
    $browser->get('/api/v1/admin/me')->assertUnauthorized();
});

it('returns the profile, branch and menu for Staf', function () {
    $branch = Branch::factory()->create(['name' => 'Jakarta Selatan']);
    $staff = Admin::factory()->staff($branch)->create(['name' => 'Sari Staf', 'password' => 'rahasia123']);
    $browser = new Browser($this);
    $browser->post('/api/v1/admin/auth/login', ['email' => $staff->email, 'password' => 'rahasia123'])->assertOk();

    $response = $browser->get('/api/v1/admin/me')->assertOk();

    expect($response->json('data.role'))->toBe('staff')
        ->and($response->json('data.branch'))->toBe(['id' => $branch->id, 'name' => 'Jakarta Selatan'])
        ->and($response->json('data.menu'))->toBe(['dashboard', 'bookings', 'payments', 'cars', 'brands', 'categories', 'customers'])
        ->and(array_keys($response->json('data')))->toEqualCanonicalizing(['id', 'name', 'email', 'role', 'branch', 'menu', 'created_at']);
});

it('returns the full menu for Super Admin', function () {
    $admin = Admin::factory()->superAdmin()->create(['password' => 'rahasia123']);
    $browser = new Browser($this);
    $browser->post('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => 'rahasia123'])->assertOk();

    expect($browser->get('/api/v1/admin/me')->json('data.menu'))->toBe([
        'dashboard', 'bookings', 'payments', 'cars', 'brands', 'categories', 'branches', 'customers', 'admins', 'audit_logs',
    ]);
});

it('keeps customer and admin sessions apart in one browser', function () {
    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    $admin = Admin::factory()->superAdmin()->create(['password' => 'rahasia123']);
    $browser = new Browser($this);

    $browser->post('/api/v1/auth/login', ['email' => $customer->email, 'password' => 'rahasia123'])->assertOk();
    $browser->post('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => 'rahasia123'])->assertOk();

    $browser->get('/api/v1/me')->assertOk()->assertJsonPath('data.id', $customer->id);
    $browser->get('/api/v1/admin/me')->assertOk()->assertJsonPath('data.id', $admin->id);
});
