<?php

use App\Domain\Admin\AuthenticateAdmin;
use App\Models\Admin;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear(AuthenticateAdmin::throttleKey('203.0.113.10', 'owner@example.test'));
    $this->admin = Admin::factory()->superAdmin()->create(['email' => 'owner@example.test', 'password' => 'rahasia123']);
});

function adminLogin(Browser $browser, string $email = 'owner@example.test', string $password = 'rahasia123', array $extra = [])
{
    return $browser->post('/api/v1/admin/auth/login', ['email' => $email, 'password' => $password, ...$extra]);
}

it('logs in a Super Admin and regenerates the session', function () {
    $browser = new Browser($this);
    $browser->get('/api/v1/health');
    $before = session()->getId();

    adminLogin($browser)->assertOk()
        ->assertJsonPath('data.role', 'super_admin')
        ->assertJsonPath('data.branch', null)
        ->assertJsonMissingPath('data.password');

    expect(session()->getId())->not->toBe($before)
        ->and($this->admin->fresh()->last_login_at)->not->toBeNull();
    $browser->get('/api/v1/admin/me')->assertOk();
});

it('answers unknown email, wrong password and deleted admins identically', function () {
    $deleted = Admin::factory()->superAdmin()->create(['email' => 'gone@example.test', 'password' => 'rahasia123']);
    $deleted->delete();

    $unknown = adminLogin(new Browser($this), 'nobody@example.test')->assertUnauthorized();
    $wrong = adminLogin(new Browser($this), password: 'salah12345')->assertUnauthorized();
    $gone = adminLogin(new Browser($this), 'gone@example.test')->assertUnauthorized();

    expect($unknown->json('message'))->toBe('Email atau kata sandi salah.')
        ->and($wrong->json())->toBe($unknown->json())
        ->and($gone->json())->toBe($unknown->json());
});

it('refuses an inactive admin without a session', function () {
    $this->admin->update(['is_active' => false]);
    $browser = new Browser($this);

    adminLogin($browser)->assertForbidden()->assertJsonPath('errors.0.code', 'account_blocked');

    $browser->get('/api/v1/admin/me')->assertUnauthorized();
    expect(DB::table('audit_logs')->where('action', 'admin.login_blocked')->count())->toBe(1);
});

it('does not accept customer credentials', function () {
    Customer::factory()->create(['email' => 'pelanggan@example.test', 'password' => 'rahasia123']);

    adminLogin(new Browser($this), 'pelanggan@example.test')->assertUnauthorized();
});

it('throttles after five failures, even with the right password', function () {
    $browser = new Browser($this);

    foreach (range(1, 5) as $_) {
        adminLogin($browser, password: 'salah12345')->assertUnauthorized();
    }

    $response = adminLogin($browser)->assertStatus(429)->assertJsonPath('errors.0.code', 'rate_limited');
    expect((int) $response->headers->get('Retry-After'))->toBeGreaterThan(0);
});

it('audits failed logins without the password', function () {
    adminLogin(new Browser($this), password: 'Rahasia-Admin-999')->assertUnauthorized();

    $row = DB::table('audit_logs')->where('action', 'admin.login_failed')->sole();

    expect($row->actor_type)->toBe('system')
        ->and(json_decode($row->meta, true))->toBe(['email' => 'owner@example.test'])
        ->and(json_encode($row))->not->toContain('Rahasia-Admin-999');
});

it('logs out on the server', function () {
    $browser = new Browser($this);
    adminLogin($browser)->assertOk();

    $browser->post('/api/v1/admin/auth/logout')->assertOk();

    $browser->get('/api/v1/admin/me')->assertUnauthorized();
});
