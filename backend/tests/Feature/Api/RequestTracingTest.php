<?php

use App\Support\Logging\RedactSensitiveData;
use App\Support\Logging\RedactSensitiveDataTap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Monolog\Handler\TestHandler;
use Monolog\Level;
use Monolog\LogRecord;

beforeEach(function () {
    Route::middleware('api')->prefix('api/test')->group(function () {
        Route::get('boom', fn () => throw new RuntimeException('kaboom'));
        Route::post('validate', fn (Request $request) => $request->validate(['name' => 'required']));
    });
});

it('generates a request id when none is sent', function () {
    $id = $this->getJson('/api/v1/health')->headers->get('X-Request-Id');

    expect(Str::isUuid($id))->toBeTrue();
});

it('propagates a valid client request id', function () {
    $id = '3f1c9a2e-8b7d-4c1e-9f0a-2b6d5e4c3a19';

    $this->getJson('/api/v1/health', ['X-Request-Id' => $id])->assertHeader('X-Request-Id', $id);
});

it('replaces an invalid client request id', function (string $invalid) {
    $id = $this->getJson('/api/v1/health', ['X-Request-Id' => $invalid])->headers->get('X-Request-Id');

    expect($id)->not->toBe($invalid)->and(Str::isUuid($id))->toBeTrue();
})->with(['<script>alert(1)</script>', str_repeat('a', 500), 'not-a-uuid']);

it('adds the request id to error responses', function (string $method, string $uri, int $status) {
    $response = $this->json($method, $uri);

    $response->assertStatus($status);
    expect(Str::isUuid($response->headers->get('X-Request-Id')))->toBeTrue();
})->with([
    ['GET', '/api/v1/does-not-exist', 404],
    ['POST', '/api/test/validate', 422],
    ['GET', '/api/test/boom', 500],
]);

it('writes the request id into error logs', function () {
    $handler = new TestHandler;
    Log::getLogger()->pushHandler($handler);

    $response = $this->getJson('/api/test/boom');
    $id = $response->headers->get('X-Request-Id');

    $errors = array_filter($handler->getRecords(), fn (LogRecord $r) => $r->level === Level::Error);
    expect($errors)->not->toBeEmpty()
        ->and(array_values($errors)[0]->context['request_id'] ?? null)->toBe($id);
});

it('redacts sensitive values at any depth', function () {
    $processor = new RedactSensitiveData;

    $record = new LogRecord(
        datetime: new DateTimeImmutable,
        channel: 'test',
        level: Level::Info,
        message: 'x',
        context: [
            'user' => ['email' => 'a@example.test', 'password' => 'Secret123', 'Password_Confirmation' => 'Secret123'],
            'headers' => ['Authorization' => 'Bearer abc', 'cookie' => 'session=1', 'xsrf_token' => 'tok'],
            'renter' => ['license_number' => '1234567890123', 'renter_license_number' => '999'],
            'token' => 'plain',
            'device_token' => 'dev',
            'safe' => 'keep me',
        ],
        extra: ['current_password' => 'old'],
    );

    $redacted = $processor($record);
    $json = json_encode([$redacted->context, $redacted->extra]);

    expect($json)->not->toContain('Secret123')
        ->not->toContain('Bearer abc')
        ->not->toContain('session=1')
        ->not->toContain('1234567890123')
        ->not->toContain('plain')
        ->not->toContain('"old"')
        ->and($redacted->context['user']['email'])->toBe('a@example.test')
        ->and($redacted->context['safe'])->toBe('keep me')
        ->and($redacted->context['user']['password'])->toBe(RedactSensitiveData::MASK);
});

it('redacts through the configured log channel', function () {
    $path = storage_path('logs/redaction-test.log');
    @unlink($path);

    config(['logging.channels.redaction_test' => [
        'driver' => 'single',
        'path' => $path,
        'tap' => [RedactSensitiveDataTap::class],
    ]]);

    Log::channel('redaction_test')->info('login attempt', ['email' => 'a@example.test', 'password' => 'Secret123']);

    $contents = (string) file_get_contents($path);
    @unlink($path);

    expect($contents)->toContain('a@example.test')
        ->toContain('[REDACTED]')
        ->not->toContain('Secret123');
});
