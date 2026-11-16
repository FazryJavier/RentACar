<?php

use App\Exceptions\ApiRenderable;
use App\Support\Http\ApiError;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class TestDomainException extends RuntimeException implements ApiRenderable
{
    public function apiStatus(): int
    {
        return 409;
    }

    public function apiMessage(): string
    {
        return 'Mobil tidak tersedia.';
    }

    public function apiErrors(): array
    {
        return [new ApiError(null, 'car_unavailable', 'Mobil tidak tersedia.', ['similar' => true])];
    }
}

beforeEach(function () {
    Route::middleware('api')->prefix('api/test')->group(function () {
        Route::get('unauthenticated', fn () => throw new AuthenticationException);
        Route::get('protected', fn () => 'secret')->middleware('auth');
        Route::get('forbidden', fn () => throw new AuthorizationException('policy says no'));
        Route::get('model', fn () => throw (new ModelNotFoundException)->setModel('App\\Models\\Car', [7]));
        Route::get('csrf', fn () => throw new TokenMismatchException);
        Route::get('teapot', fn () => throw new HttpException(418));
        Route::get('boom', fn () => throw new RuntimeException('SQLSTATE[08006] host=db.internal password=hunter2'));
        Route::get('domain', fn () => throw new TestDomainException);
        Route::get('overlap', function () {
            DB::table('exclusion_test')->insert(['span' => '[1,10)']);
            DB::table('exclusion_test')->insert(['span' => '[5,15)']);
        });
    });
});

function assertErrorEnvelope($response, int $status, string $code): void
{
    $response->assertStatus($status)
        ->assertExactJsonStructure(['code', 'success', 'message', 'data', 'errors' => [['field', 'code', 'message']], 'meta'])
        ->assertJson(['code' => $status, 'success' => false, 'data' => null, 'errors' => [['code' => $code]]]);
}

it('renders 401 for unauthenticated requests without redirecting', function () {
    assertErrorEnvelope($this->get('/api/test/unauthenticated'), 401, 'unauthenticated');
    assertErrorEnvelope($this->get('/api/test/protected'), 401, 'unauthenticated');
});

it('renders 403 for denied authorization', function () {
    $response = $this->get('/api/test/forbidden');

    assertErrorEnvelope($response, 403, 'forbidden');
    expect($response->getContent())->not->toContain('policy says no');
});

it('renders 404 for missing routes and models', function () {
    assertErrorEnvelope($this->get('/api/v1/does-not-exist'), 404, 'not_found');

    $response = $this->get('/api/test/model');
    assertErrorEnvelope($response, 404, 'not_found');
    expect($response->getContent())->not->toContain('App\\\\Models');
});

it('renders 405 for a wrong method', function () {
    assertErrorEnvelope($this->post('/api/v1/health'), 405, 'method_not_allowed');
});

it('renders 419 for a CSRF token mismatch', function () {
    assertErrorEnvelope($this->get('/api/test/csrf'), 419, 'csrf_token_mismatch');
});

it('renders other HTTP exceptions with their status', function () {
    assertErrorEnvelope($this->get('/api/test/teapot'), 418, 'http_error');
});

it('renders 409 for a PostgreSQL exclusion constraint violation', function () {
    Schema::create('exclusion_test', function ($table) {
        $table->id();
    });
    DB::statement('ALTER TABLE exclusion_test ADD COLUMN span int4range NOT NULL');
    DB::statement('ALTER TABLE exclusion_test ADD CONSTRAINT exclusion_test_no_overlap EXCLUDE USING gist (span WITH &&)');

    try {
        $response = $this->get('/api/test/overlap');
        assertErrorEnvelope($response, 409, 'conflict');
        expect($response->getContent())->not->toContain('SQLSTATE');
    } finally {
        Schema::dropIfExists('exclusion_test');
    }
});

it('renders 500 without leaking internals when debug is off', function () {
    config(['app.debug' => false]);

    $response = $this->get('/api/test/boom');

    assertErrorEnvelope($response, 500, 'internal_error');
    $response->assertJsonPath('meta', null);
    expect($response->getContent())
        ->not->toContain('SQLSTATE')
        ->not->toContain('db.internal')
        ->not->toContain('hunter2')
        ->not->toContain('trace')
        ->not->toContain('.php');
});

it('adds debug metadata without traces when debug is on', function () {
    config(['app.debug' => true]);

    $response = $this->get('/api/test/boom');

    $response->assertStatus(500)->assertJsonPath('meta.debug.exception', RuntimeException::class);
    expect($response->json('meta.debug'))->not->toHaveKeys(['trace', 'file', 'line']);
});

it('renders 503 in maintenance mode', function () {
    $this->app->maintenanceMode()->activate([]);

    try {
        assertErrorEnvelope($this->get('/api/v1/health'), 503, 'service_unavailable');
    } finally {
        $this->app->maintenanceMode()->deactivate();
    }
});

it('lets domain exceptions provide their own status, code and details', function () {
    $this->get('/api/test/domain')
        ->assertStatus(409)
        ->assertJsonPath('errors.0.code', 'car_unavailable')
        ->assertJsonPath('errors.0.details.similar', true)
        ->assertJsonPath('message', 'Mobil tidak tersedia.');
});

it('answers in JSON even without an Accept header', function () {
    $response = $this->call('GET', '/api/v1/does-not-exist');

    expect($response->headers->get('Content-Type'))->toContain('application/json');
    $response->assertJsonPath('errors.0.code', 'not_found');
});
