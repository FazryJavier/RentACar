<?php

use Illuminate\Support\Facades\Cache;
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
    DB::shouldReceive('select')->andThrow(new RuntimeException('SQLSTATE[08006] host=db.internal password=secret'));

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
        ->not->toContain('db.internal')
        ->not->toContain('secret')
        ->not->toContain('SQLSTATE');
});

it('returns 503 with cache=fail when the cache store fails', function () {
    Cache::shouldReceive('put')->andThrow(new RuntimeException('Connection refused [tcp://10.0.0.5:6379]'));

    $response = $this->getJson('/api/v1/health');

    $response->assertStatus(503)
        ->assertJsonPath('errors.0.details.cache', 'fail')
        ->assertJsonPath('errors.0.details.database', 'ok');

    expect($response->getContent())->not->toContain('10.0.0.5');
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
