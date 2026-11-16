<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::middleware('api')->prefix('api/test')->group(function () {
        Route::post('echo', fn (Request $request) => response()->json(['keys' => array_keys($request->all())]));
        Route::get('cached', fn () => response()->json(['ok' => true]))->middleware('cache.headers:public;max_age=60');
    });
});

function jsonBodyOfSize(int $bytes): string
{
    $prefix = '{"data":"';
    $suffix = '"}';

    return $prefix.str_repeat('a', $bytes - strlen($prefix) - strlen($suffix)).$suffix;
}

it('rejects JSON bodies above 256 KB with 413', function () {
    $body = jsonBodyOfSize(300 * 1024);

    $response = $this->call('POST', '/api/test/echo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
        'CONTENT_LENGTH' => (string) strlen($body),
    ], $body);

    $response->assertStatus(413)->assertJsonPath('errors.0.code', 'payload_too_large');
});

it('accepts a JSON body of exactly 256 KB', function () {
    $body = jsonBodyOfSize(262_144);

    $response = $this->call('POST', '/api/test/echo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
        'CONTENT_LENGTH' => (string) strlen($body),
    ], $body);

    $response->assertOk()->assertJsonPath('keys', ['data']);
});

it('rejects unsupported media types with 415', function () {
    $response = $this->call('POST', '/api/test/echo', [], [], [], [
        'CONTENT_TYPE' => 'text/plain',
        'HTTP_ACCEPT' => 'application/json',
    ], 'hello');

    $response->assertStatus(415)->assertJsonPath('errors.0.code', 'unsupported_media_type');
});

it('rejects malformed JSON with 400', function () {
    $response = $this->call('POST', '/api/test/echo', [], [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
    ], '{"a":');

    $response->assertStatus(400)->assertJsonPath('errors.0.code', 'malformed_json');
});

it('lets GET requests without a body through', function () {
    $this->getJson('/api/v1/health')->assertOk();
});

it('accepts multipart bodies regardless of the JSON size limit', function () {
    $this->post('/api/test/echo', ['name' => 'Budi', 'note' => str_repeat('a', 300 * 1024)], [
        'Accept' => 'application/json',
    ])->assertOk();
});

it('sets Cache-Control no-store by default', function () {
    expect($this->getJson('/api/v1/health')->headers->get('Cache-Control'))->toContain('no-store');
});

it('keeps an explicit route cache policy', function () {
    $cacheControl = $this->getJson('/api/test/cached')->headers->get('Cache-Control');

    expect($cacheControl)->toContain('public')->toContain('max-age=60')->not->toContain('no-store');
});
