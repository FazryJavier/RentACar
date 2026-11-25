<?php

use App\Domain\Customer\AuthenticateCustomer;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear(AuthenticateCustomer::throttleKey('203.0.113.10', 'budi@example.test'));
    $this->customer = Customer::factory()->create(['email' => 'budi@example.test', 'password' => 'rahasia123']);
});

function login(Browser $browser, string $email = 'budi@example.test', string $password = 'rahasia123', array $extra = [])
{
    return $browser->post('/api/v1/auth/login', ['email' => $email, 'password' => $password, ...$extra]);
}

it('logs in, regenerates the session and records the login time', function () {
    $browser = new Browser($this);
    $browser->get('/api/v1/health');
    $before = session()->getId();

    login($browser)->assertOk()->assertJsonPath('data.email', 'budi@example.test')->assertJsonMissingPath('data.password');

    expect(session()->getId())->not->toBe($before)
        ->and($this->customer->fresh()->last_login_at)->not->toBeNull();
    $browser->get('/api/v1/me')->assertOk();
});

it('accepts the email in any letter case', function () {
    login(new Browser($this), 'BUDI@Example.test')->assertOk();
});

it('answers unknown email and wrong password identically', function () {
    $unknown = login(new Browser($this), 'nobody@example.test')->assertUnauthorized();
    $wrong = login(new Browser($this), password: 'salah12345')->assertUnauthorized();

    expect($unknown->json('message'))->toBe('Email atau kata sandi salah.')
        ->and($wrong->json('message'))->toBe($unknown->json('message'))
        ->and($wrong->json('errors'))->toBe($unknown->json('errors'))
        ->and($wrong->json('errors.0.code'))->toBe('unauthenticated');
});

it('refuses a blocked account without creating a session', function () {
    $this->customer->update(['is_blocked' => true]);
    $browser = new Browser($this);

    login($browser)->assertForbidden()
        ->assertJsonPath('errors.0.code', 'account_blocked')
        ->assertJsonPath('message', 'Akun dinonaktifkan. Hubungi admin.');

    $browser->get('/api/v1/me')->assertUnauthorized();
});

it('does not reveal a blocked account to a wrong password', function () {
    $this->customer->update(['is_blocked' => true]);

    login(new Browser($this), password: 'salah12345')->assertUnauthorized();
});

it('issues a remember-me cookie when asked', function () {
    $browser = new Browser($this);

    login($browser, extra: ['remember' => true])->assertOk();

    expect($this->customer->fresh()->getRememberToken())->not->toBeNull()
        ->and($browser->hasCookie(auth()->guard('web')->getRecallerName()))->toBeTrue();
});

it('blocks the sixth attempt after five failures, even with the right password', function () {
    $browser = new Browser($this);

    foreach (range(1, 5) as $_) {
        login($browser, password: 'salah12345')->assertUnauthorized();
    }

    $response = login($browser)->assertStatus(429)->assertJsonPath('errors.0.code', 'rate_limited');
    expect((int) $response->headers->get('Retry-After'))->toBeGreaterThan(0)->toBeLessThanOrEqual(60);
});

it('counts failures per email', function () {
    Customer::factory()->create(['email' => 'sari@example.test', 'password' => 'rahasia123']);
    $browser = new Browser($this);

    foreach (range(1, 5) as $_) {
        login($browser, password: 'salah12345');
    }

    login($browser, 'sari@example.test')->assertOk();
});

it('clears the failure counter after a successful login', function () {
    $browser = new Browser($this);

    foreach (range(1, 4) as $_) {
        login($browser, password: 'salah12345')->assertUnauthorized();
    }
    login($browser)->assertOk();

    login(new Browser($this), password: 'salah12345')->assertUnauthorized();
});

it('audits failed logins without the password', function () {
    login(new Browser($this), password: 'Rahasia-Salah-999')->assertUnauthorized();

    $row = DB::table('audit_logs')->where('action', 'customer.login_failed')->sole();

    expect($row->actor_type)->toBe('system')
        ->and(json_decode($row->meta, true))->toBe(['email' => 'budi@example.test'])
        ->and($row->ip_address)->toBe('203.0.113.10')
        ->and(json_encode($row))->not->toContain('Rahasia-Salah-999');
});

it('validates the login input', function () {
    (new Browser($this))->post('/api/v1/auth/login', ['email' => 'bukan-email'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'email');
});
