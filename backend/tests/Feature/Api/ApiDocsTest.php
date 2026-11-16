<?php

it('denies the API docs outside the local environment', function () {
    expect(app()->environment())->toBe('testing');

    $this->get('/docs/api.json')->assertStatus(403);
    $this->get('/docs/api')->assertStatus(403);
});

it('serves the OpenAPI document in the local environment', function () {
    $this->app->detectEnvironment(fn () => 'local');

    $response = $this->getJson('/docs/api.json');

    $response->assertOk()
        ->assertJsonPath('info.title', 'RentACar API')
        ->assertJsonPath('info.version', 'v1');
    expect($response->json('paths'))->toHaveKey('/v1/health')
        ->and($response->json('paths./v1/health'))->toHaveKey('get');
});
