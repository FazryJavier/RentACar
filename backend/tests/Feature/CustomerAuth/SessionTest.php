<?php

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Browser;
use Tests\TestCase;

uses(RefreshDatabase::class);

function signedIn(TestCase $test, Customer $customer, string $password = 'rahasia123'): Browser
{
    $browser = new Browser($test);
    $browser->post('/api/v1/auth/login', ['email' => $customer->email, 'password' => $password])->assertOk();

    return $browser;
}

it('answers guests with a 401 envelope', function () {
    (new Browser($this))->get('/api/v1/me')
        ->assertUnauthorized()
        ->assertJsonPath('success', false)
        ->assertJsonPath('data', null)
        ->assertJsonPath('errors.0.code', 'unauthenticated');
});

it('logs out on the server', function () {
    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    $browser = signedIn($this, $customer);

    $browser->post('/api/v1/auth/logout')->assertOk()->assertJsonPath('data', null);

    $browser->get('/api/v1/me')->assertUnauthorized();
});

it('requires a session to log out', function () {
    (new Browser($this))->post('/api/v1/auth/logout')->assertUnauthorized();
});

it('ends the session of a customer blocked while signed in', function () {
    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    $browser = signedIn($this, $customer);

    $customer->update(['is_blocked' => true]);

    $browser->get('/api/v1/me')->assertForbidden()->assertJsonPath('errors.0.code', 'account_blocked');
    $browser->get('/api/v1/me')->assertUnauthorized();
});

it('does not accept another guard on customer routes', function () {
    config(['auth.guards.other' => ['driver' => 'session', 'provider' => 'customers']]);
    $customer = Customer::factory()->create();

    $this->actingAs($customer, 'other')->getJson('/api/v1/me')->assertUnauthorized();
});

it('rejects a state-changing browser request without a CSRF token', function () {
    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    // CSRF checks are skipped in the testing environment; switch it off for this request only.
    $this->app['env'] = 'local';

    $response = (new Browser($this))->json(
        'POST',
        '/api/v1/auth/login',
        ['email' => $customer->email, 'password' => 'rahasia123'],
        ['Sec-Fetch-Site' => 'cross-site'],
    );

    $this->app['env'] = 'testing';
    $response->assertStatus(419)->assertJsonPath('errors.0.code', 'csrf_token_mismatch');
});
