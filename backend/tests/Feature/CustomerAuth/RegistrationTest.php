<?php

use App\Domain\Customer\RegisterCustomer;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

function registration(array $overrides = []): array
{
    return [
        'name' => 'Budi Santoso',
        'email' => 'budi@example.test',
        'phone' => '0812-3456-7890',
        'password' => 'rahasia123',
        'password_confirmation' => 'rahasia123',
        ...$overrides,
    ];
}

it('registers, hashes the password, normalises data and signs the customer in', function () {
    $browser = new Browser($this);

    $response = $browser->post('/api/v1/auth/register', registration(['email' => '  Budi@Example.TEST ']));

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.email', 'budi@example.test')
        ->assertJsonPath('data.phone', '6281234567890')
        ->assertJsonMissingPath('data.password');
    expect(array_keys($response->json('data')))->toEqualCanonicalizing(['id', 'name', 'email', 'phone', 'address', 'license_number', 'created_at']);

    $customer = Customer::query()->sole();
    expect($customer->password)->not->toBe('rahasia123')
        ->and(Hash::check('rahasia123', $customer->password))->toBeTrue();

    $browser->get('/api/v1/me')->assertOk()->assertJsonPath('data.id', $customer->id);
});

it('rejects an email registered in another letter case', function () {
    Customer::factory()->create(['email' => 'budi@example.test']);

    (new Browser($this))->post('/api/v1/auth/register', registration(['email' => 'Budi@Example.TEST']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'email')
        ->assertJsonPath('errors.0.code', 'not_unique')
        ->assertJsonPath('errors.0.message', 'Email sudah terdaftar');
});

it('turns a concurrent duplicate into 422 not_unique', function () {
    Customer::factory()->create(['email' => 'budi@example.test']);

    // Simulates a registration that passed validation before the other one committed.
    expect(fn () => app(RegisterCustomer::class)->handle([
        'name' => 'Budi', 'email' => 'BUDI@example.test', 'phone' => '081234567890', 'password' => 'rahasia123',
    ]))->toThrow(ValidationException::class);

    expect(Customer::query()->count())->toBe(1);
});

it('enforces the password rules at the boundaries', function (string $password, bool $valid) {
    $response = (new Browser($this))->post('/api/v1/auth/register', registration([
        'email' => 'budi@example.test', 'password' => $password, 'password_confirmation' => $password,
    ]));

    if ($valid) {
        $response->assertCreated();
    } else {
        $response->assertUnprocessable()->assertJsonPath('errors.0.field', 'password');
    }
})->with([
    '7 chars' => ['abc1234', false],
    '8 chars' => ['abcd1234', true],
    '72 chars' => [str_repeat('a', 71).'1', true],
    '73 chars' => [str_repeat('a', 72).'1', false],
    'letters only' => ['abcdefgh', false],
    'digits only' => ['12345678', false],
    'symbols allowed' => ['abc-123!x', true],
]);

it('rejects a password equal to the email', function () {
    (new Browser($this))->post('/api/v1/auth/register', registration([
        'email' => 'budi1@example.test', 'password' => 'budi1@example.test', 'password_confirmation' => 'budi1@example.test',
    ]))->assertUnprocessable()->assertJsonPath('errors.0.message', 'Kata sandi tidak boleh sama dengan email');
});

it('requires a matching confirmation', function () {
    (new Browser($this))->post('/api/v1/auth/register', registration(['password_confirmation' => 'beda12345']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.code', 'mismatch')
        ->assertJsonPath('errors.0.message', 'Konfirmasi kata sandi tidak cocok');
});

it('accepts and normalises Indonesian mobile numbers', function (string $input, string $stored) {
    (new Browser($this))->post('/api/v1/auth/register', registration(['phone' => $input]))->assertCreated();

    expect(Customer::query()->sole()->phone)->toBe($stored);
})->with([
    ['08123456789', '628123456789'],
    ['+6281234567890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['+62 812-0000-1111', '6281200001111'],
]);

it('rejects invalid phone numbers', function (string $phone) {
    (new Browser($this))->post('/api/v1/auth/register', registration(['phone' => $phone]))
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'phone')
        ->assertJsonPath('errors.0.message', 'Nomor HP tidak valid');
})->with(['0712345678', '0812345', '08123456789012345', 'abc']);

it('validates the name length with the FRD message', function (string $name) {
    (new Browser($this))->post('/api/v1/auth/register', registration(['name' => $name]))
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.message', 'Nama wajib diisi (2–100 karakter)');
})->with(['', 'A', str_repeat('a', 101)]);
