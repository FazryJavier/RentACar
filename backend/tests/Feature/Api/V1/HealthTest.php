<?php

use Illuminate\Support\Facades\DB;

it('returns 200 with the standard envelope when all dependencies are up', function () {
    $response = $this->getJson('/api/v1/health');

    $response->assertOk()
        ->assertExactJsonStructure([
            'code', 'success', 'message',
            'data' => ['status', 'checks' => ['database', 'cache'], 'time'],
            'errors', 'meta',
        ])
        ->assertJson([
            'code' => 200,
            'success' => true,
            'data' => ['status' => 'ok', 'checks' => ['database' => 'ok', 'cache' => 'ok']],
            'errors' => null,
            'meta' => null,
        ]);

    expect($response->json('data.time'))->toMatch('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/');
});

it('is publicly accessible without authentication', function () {
    $this->get('/api/v1/health')->assertStatus(200);
});

it('returns 503 with database=fail when the database is unreachable', function () {
    // Simulate a real connection failure (the database does not exist) instead of mocking the
    // DB facade: facade mocks break whenever the framework makes additional DB calls.
    config(['database.connections.pgsql.database' => 'rentacar_missing_db_test']);
    DB::purge('pgsql');

    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(503)
        ->assertJson([
            'code' => 503,
            'success' => false,
            'data' => null,
            'meta' => null,
            'errors' => [[
                'field' => null,
                'code' => 'service_unavailable',
                'details' => ['database' => 'fail', 'cache' => 'ok'],
            ]],
        ]);

    expect($response->getContent())
        ->not->toContain('rentacar_missing_db_test')
        ->not->toContain('SQLSTATE');
});

it('returns 503 with cache=fail when the cache store fails', function () {
    // Default cache store points at an unreachable Redis; rate limiting keeps its own working store.
    config([
        'cache.limiter' => 'array',
        'cache.default' => 'redis',
        'database.redis.client' => 'predis',
        'database.redis.cache.host' => '127.0.0.1',
        'database.redis.cache.port' => 1,
        'database.redis.cache.password' => null,
        'database.redis.cache.timeout' => 0.5,
    ]);

    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(503)
        ->assertJsonPath('errors.0.details.cache', 'fail')
        ->assertJsonPath('errors.0.details.database', 'ok');

    expect($response->getContent())->not->toContain('127.0.0.1')->not->toContain('Connection refused');
});

it('answers a wrong method with a JSON 405 even without an Accept header', function () {
    $response = $this->post('/api/v1/health');

    $response->assertStatus(405);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
});

it('answers an unknown API path with a JSON 404 even without an Accept header', function () {
    $response = $this->get('/api/v1/does-not-exist');

    $response->assertStatus(404);
    expect($response->headers->get('Content-Type'))->toContain('application/json');
});
