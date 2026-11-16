<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware(['api', 'throttle:auth'])->prefix('api/test')->group(function () {
        Route::post('login', fn (Request $request) => response()->json(['ok' => true]));
    });
});

it('registers every named limiter', function (string $name) {
    expect(RateLimiter::limiter($name))->not->toBeNull();
})->with(['public', 'auth', 'booking-create', 'payment-upload', 'customer', 'admin', 'telemetry']);

it('allows 60 public requests per minute and limits the 61st', function () {
    for ($i = 1; $i <= 60; $i++) {
        $this->getJson('/api/v1/health')->assertOk();
    }

    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(429)
        ->assertJson(['code' => 429, 'success' => false, 'data' => null, 'errors' => [['code' => 'rate_limited']]]);
    expect((int) $response->headers->get('Retry-After'))->toBeGreaterThan(0);
});

it('sends rate limit headers', function () {
    $this->getJson('/api/v1/health')
        ->assertHeader('X-RateLimit-Limit', '60')
        ->assertHeader('X-RateLimit-Remaining', '59');
});

it('keeps separate buckets per forwarded client IP behind the trusted proxy', function () {
    $fromProxy = fn (string $ip) => $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->withHeader('X-Forwarded-For', $ip)
        ->getJson('/api/v1/health');

    for ($i = 1; $i <= 60; $i++) {
        $fromProxy('203.0.113.10')->assertOk();
    }

    $fromProxy('203.0.113.10')->assertStatus(429);
    $fromProxy('203.0.113.11')->assertOk();
});

it('keys the auth limiter by IP and email', function () {
    for ($i = 1; $i <= 5; $i++) {
        $this->postJson('/api/test/login', ['email' => 'User@Example.test'])->assertOk();
    }

    $this->postJson('/api/test/login', ['email' => 'user@example.test'])->assertStatus(429);
    $this->postJson('/api/test/login', ['email' => 'other@example.test'])->assertOk();
});
