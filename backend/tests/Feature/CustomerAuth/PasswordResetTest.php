<?php

use App\Models\Customer;
use App\Notifications\CustomerResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\Support\Browser;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();
    config(['app.frontend_url' => 'http://localhost:3000']);
    $this->customer = Customer::factory()->create(['email' => 'budi@example.test', 'password' => 'rahasia123']);
});

function forgot(TestCase $test, string $email)
{
    return (new Browser($test))->post('/api/v1/auth/forgot-password', ['email' => $email]);
}

it('answers registered and unknown emails identically', function () {
    $registered = forgot($this, 'budi@example.test')->assertOk();
    $unknown = forgot($this, 'nobody@example.test')->assertOk();

    expect($unknown->json())->toBe($registered->json())
        ->and($registered->json('message'))->toBe('Jika email terdaftar, tautan atur ulang telah dikirim.');
    Notification::assertSentToTimes($this->customer, CustomerResetPassword::class, 1);
    Notification::assertCount(1);
});

it('links to the frontend reset page', function () {
    forgot($this, 'Budi@Example.test')->assertOk();

    Notification::assertSentTo($this->customer, function (CustomerResetPassword $notification) {
        $url = $notification->url($this->customer);

        return str_starts_with($url, 'http://localhost:3000/atur-ulang-kata-sandi?token=')
            && str_contains($url, 'email=budi%40example.test');
    });
});

it('does not reveal broker throttling', function () {
    $first = forgot($this, 'budi@example.test');
    $second = forgot($this, 'budi@example.test');

    expect($second->json())->toBe($first->json());
    Notification::assertSentToTimes($this->customer, CustomerResetPassword::class, 1);
});

function resetWith(TestCase $test, string $token, string $password = 'baru12345')
{
    return (new Browser($test))->post('/api/v1/auth/reset-password', [
        'token' => $token, 'email' => 'budi@example.test', 'password' => $password, 'password_confirmation' => $password,
    ]);
}

it('resets with a valid token, which then expires', function () {
    $token = Password::broker('customers')->createToken($this->customer);
    $this->travel(59)->minutes();

    resetWith($this, $token)->assertOk();

    expect(Hash::check('baru12345', $this->customer->fresh()->password))->toBeTrue()
        ->and(DB::table('customer_password_reset_tokens')->count())->toBe(0)
        ->and(DB::table('audit_logs')->where('action', 'customer.password_reset')->count())->toBe(1);
    resetWith($this, $token, 'lagi12345')->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'token')
        ->assertJsonPath('errors.0.code', 'invalid');

    (new Browser($this))->post('/api/v1/auth/login', ['email' => 'budi@example.test', 'password' => 'rahasia123'])->assertUnauthorized();
    (new Browser($this))->post('/api/v1/auth/login', ['email' => 'budi@example.test', 'password' => 'baru12345'])->assertOk();
});

it('rejects an expired token', function () {
    $token = Password::broker('customers')->createToken($this->customer);
    $this->travel(61)->minutes();

    resetWith($this, $token)->assertUnprocessable()
        ->assertJsonPath('errors.0.message', 'Tautan atur ulang tidak valid atau sudah kedaluwarsa.');
});

it('signs out other sessions and rotates the remember token', function () {
    $other = new Browser($this);
    $other->post('/api/v1/auth/login', ['email' => 'budi@example.test', 'password' => 'rahasia123', 'remember' => true])->assertOk();
    $rememberBefore = $this->customer->fresh()->getRememberToken();

    resetWith($this, Password::broker('customers')->createToken($this->customer))->assertOk();

    expect($this->customer->fresh()->getRememberToken())->not->toBe($rememberBefore);
    $other->get('/api/v1/me')->assertUnauthorized();
});

it('applies the password rules on reset', function () {
    resetWith($this, Password::broker('customers')->createToken($this->customer), 'pendek1')
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'password');
});
