<?php

use App\Models\Admin;
use App\Notifications\AdminResetPassword;
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
    $this->admin = Admin::factory()->superAdmin()->create(['email' => 'owner@example.test', 'password' => 'rahasia123']);
});

function adminForgot(TestCase $test, string $email)
{
    return (new Browser($test))->post('/api/v1/admin/auth/forgot-password', ['email' => $email]);
}

it('answers registered, unknown and inactive emails identically', function () {
    Admin::factory()->superAdmin()->create(['email' => 'off@example.test', 'is_active' => false]);

    $known = adminForgot($this, 'owner@example.test')->assertOk();
    $unknown = adminForgot($this, 'nobody@example.test')->assertOk();
    $inactive = adminForgot($this, 'off@example.test')->assertOk();

    expect($unknown->json())->toBe($known->json())->and($inactive->json())->toBe($known->json());
    Notification::assertSentToTimes($this->admin, AdminResetPassword::class, 1);
    Notification::assertCount(1);
});

it('links to the admin reset page', function () {
    adminForgot($this, 'owner@example.test');

    Notification::assertSentTo($this->admin, fn (AdminResetPassword $n) => str_starts_with($n->url($this->admin), 'http://localhost:3000/admin/atur-ulang-kata-sandi?token=')
        && str_contains($n->url($this->admin), 'email=owner%40example.test'));
});

function adminReset(TestCase $test, string $token, string $password = 'baru12345')
{
    return (new Browser($test))->post('/api/v1/admin/auth/reset-password', [
        'token' => $token, 'email' => 'owner@example.test', 'password' => $password, 'password_confirmation' => $password,
    ]);
}

it('resets with a valid token and signs out other sessions', function () {
    $other = new Browser($this);
    $other->post('/api/v1/admin/auth/login', ['email' => 'owner@example.test', 'password' => 'rahasia123'])->assertOk();

    adminReset($this, Password::broker('admins')->createToken($this->admin))->assertOk();

    expect(Hash::check('baru12345', $this->admin->fresh()->password))->toBeTrue()
        ->and(DB::table('admin_password_reset_tokens')->count())->toBe(0)
        ->and(DB::table('audit_logs')->where('action', 'admin.password_reset')->count())->toBe(1);
    $other->get('/api/v1/admin/me')->assertUnauthorized();
});

it('rejects expired and reused tokens', function () {
    $token = Password::broker('admins')->createToken($this->admin);
    adminReset($this, $token)->assertOk();
    adminReset($this, $token, 'lagi12345')->assertUnprocessable()->assertJsonPath('errors.0.field', 'token')->assertJsonPath('errors.0.code', 'invalid');

    $expired = Password::broker('admins')->createToken($this->admin->fresh());
    $this->travel(61)->minutes();
    adminReset($this, $expired, 'lagi12345')->assertUnprocessable()->assertJsonPath('errors.0.field', 'token');
});

it('changes the password, keeps this session and signs out others', function () {
    $here = new Browser($this);
    $here->post('/api/v1/admin/auth/login', ['email' => 'owner@example.test', 'password' => 'rahasia123'])->assertOk();
    $other = new Browser($this);
    $other->post('/api/v1/admin/auth/login', ['email' => 'owner@example.test', 'password' => 'rahasia123'])->assertOk();

    $here->json('PUT', '/api/v1/admin/me/password', ['current_password' => 'salah12345', 'password' => 'baru12345', 'password_confirmation' => 'baru12345'])
        ->assertUnprocessable()->assertJsonPath('errors.0.message', 'Kata sandi lama salah');

    $here->json('PUT', '/api/v1/admin/me/password', ['current_password' => 'rahasia123', 'password' => 'baru12345', 'password_confirmation' => 'baru12345'])
        ->assertOk();

    $here->get('/api/v1/admin/me')->assertOk();
    $other->get('/api/v1/admin/me')->assertUnauthorized();
    expect(DB::table('audit_logs')->where('action', 'admin.password_changed')->count())->toBe(1);
});
