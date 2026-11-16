<?php

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Route::middleware('api')->prefix('api/test')->group(function () {
        Route::post('validate', fn (Request $request) => $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'email' => ['nullable', 'email'],
            'status' => ['nullable', 'in:active,inactive'],
            'date' => ['nullable', 'date'],
            'code' => ['nullable', 'regex:/^[A-Z]+$/'],
            'seats' => ['nullable', 'integer', 'between:2,16'],
            'password' => ['nullable', 'string', 'confirmed'],
            'positions' => ['nullable', 'array'],
            'positions.*.lat' => ['required', 'numeric', 'between:-90,90'],
            'proof' => ['nullable', 'file', 'mimes:jpg,png,pdf', 'max:2048'],
            'slug' => ['nullable', 'unique:validation_unique_test,slug'],
            'agree' => ['sometimes', 'accepted'],
        ]));
    });
});

function errorFor($response, string $field): ?array
{
    return collect($response->json('errors'))->firstWhere('field', $field);
}

it('returns 422 with the standard envelope and message', function () {
    $this->postJson('/api/test/validate', [])
        ->assertStatus(422)
        ->assertJson([
            'code' => 422,
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'data' => null,
            'meta' => null,
        ]);
});

it('maps required and format rules', function () {
    $response = $this->postJson('/api/test/validate', [
        'email' => 'abc',
        'status' => 'deleted',
        'date' => 'not-a-date',
        'code' => 'abc',
    ]);

    expect(errorFor($response, 'name')['code'])->toBe('required')
        ->and(errorFor($response, 'email')['code'])->toBe('invalid_format')
        ->and(errorFor($response, 'status')['code'])->toBe('invalid_format')
        ->and(errorFor($response, 'date')['code'])->toBe('invalid_format')
        ->and(errorFor($response, 'code')['code'])->toBe('invalid_format');
});

it('maps string length boundaries to too_short and too_long', function () {
    expect(errorFor($this->postJson('/api/test/validate', ['name' => 'a']), 'name')['code'])->toBe('too_short')
        ->and(errorFor($this->postJson('/api/test/validate', ['name' => str_repeat('a', 101)]), 'name')['code'])->toBe('too_long');

    $this->postJson('/api/test/validate', ['name' => 'ab'])->assertOk();
    $this->postJson('/api/test/validate', ['name' => str_repeat('a', 100)])->assertOk();
});

it('maps numeric ranges and nested paths to out_of_range', function () {
    $response = $this->postJson('/api/test/validate', [
        'name' => 'Budi',
        'seats' => 17,
        'positions' => [['lat' => 0], ['lat' => 1], ['lat' => 2], ['lat' => 91]],
    ]);

    expect(errorFor($response, 'seats')['code'])->toBe('out_of_range')
        ->and(errorFor($response, 'positions.3.lat')['code'])->toBe('out_of_range');
});

it('maps confirmed, unique, file and unknown rules', function () {
    Schema::create('validation_unique_test', function ($table) {
        $table->id();
        $table->string('slug');
    });

    try {
        DB::table('validation_unique_test')->insert(['slug' => 'taken']);

        $response = $this->post('/api/test/validate', [
            'name' => 'Budi',
            'password' => 'secret123',
            'password_confirmation' => 'different',
            'slug' => 'taken',
            'agree' => 'no',
        ], ['Accept' => 'application/json']);

        expect(errorFor($response, 'password')['code'])->toBe('mismatch')
            ->and(errorFor($response, 'slug')['code'])->toBe('not_unique')
            ->and(errorFor($response, 'agree')['code'])->toBe('invalid');
    } finally {
        Schema::dropIfExists('validation_unique_test');
    }
});

it('maps file type and file size rules', function () {
    $wrongType = $this->post('/api/test/validate', [
        'name' => 'Budi',
        'proof' => UploadedFile::fake()->create('proof.exe', 10, 'application/x-msdownload'),
    ], ['Accept' => 'application/json']);

    $tooLarge = $this->post('/api/test/validate', [
        'name' => 'Budi',
        'proof' => UploadedFile::fake()->create('proof.pdf', 3000, 'application/pdf'),
    ], ['Accept' => 'application/json']);

    expect(errorFor($wrongType, 'proof')['code'])->toBe('invalid_file_type')
        ->and(errorFor($tooLarge, 'proof')['code'])->toBe('file_too_large');
});

it('returns Indonesian messages', function () {
    $response = $this->postJson('/api/test/validate', []);

    expect(errorFor($response, 'name')['message'])->toBe('Nama wajib diisi.');
});
