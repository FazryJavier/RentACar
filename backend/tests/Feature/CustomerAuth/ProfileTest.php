<?php

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->customer = Customer::factory()->create([
        'name' => 'Budi Santoso', 'email' => 'budi@example.test', 'password' => 'rahasia123',
        'phone' => '6281111111111', 'address' => 'Jl. Contoh 1', 'license_number' => '123456789012',
    ]);
    $this->browser = new Browser($this);
    $this->browser->post('/api/v1/auth/login', ['email' => 'budi@example.test', 'password' => 'rahasia123'])->assertOk();
});

it('returns only the documented fields of the signed-in customer', function () {
    Customer::factory()->create();

    $response = $this->browser->get('/api/v1/me')->assertOk()->assertHeader('Cache-Control', 'no-store, private');

    expect($response->json('data'))->toMatchArray(['id' => $this->customer->id, 'email' => 'budi@example.test'])
        ->and(array_keys($response->json('data')))->toEqualCanonicalizing(['id', 'name', 'email', 'phone', 'address', 'license_number', 'created_at'])
        ->and($response->json('data.created_at'))->toEndWith('Z');
});

it('updates only the given fields and normalises them', function () {
    $this->browser->json('PATCH', '/api/v1/me', ['phone' => '+62 812 0000 1111', 'license_number' => 'ab1234567890'])
        ->assertOk()
        ->assertJsonPath('data.phone', '6281200001111')
        ->assertJsonPath('data.license_number', 'AB1234567890')
        ->assertJsonPath('data.name', 'Budi Santoso')
        ->assertJsonPath('data.address', 'Jl. Contoh 1');
});

it('never changes the email from the profile', function () {
    $this->browser->json('PATCH', '/api/v1/me', ['email' => 'lain@example.test', 'name' => 'Budi S'])->assertOk();

    expect($this->customer->fresh()->email)->toBe('budi@example.test')
        ->and($this->customer->fresh()->name)->toBe('Budi S');
});

it('validates the driving licence number', function (string $license) {
    $this->browser->json('PATCH', '/api/v1/me', ['license_number' => $license])
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'license_number')
        ->assertJsonPath('errors.0.message', 'Nomor SIM tidak valid');
})->with(['12345', 'ABC-123-456-789', str_repeat('1', 17)]);

it('allows clearing the address and licence', function () {
    $this->browser->json('PATCH', '/api/v1/me', ['address' => '', 'license_number' => ''])
        ->assertOk()
        ->assertJsonPath('data.address', null)
        ->assertJsonPath('data.license_number', null);
});

it('limits the address length', function () {
    $this->browser->json('PATCH', '/api/v1/me', ['address' => str_repeat('a', 256)])
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.message', 'Alamat maksimal 255 karakter');
});

function changePassword(Browser $browser, string $current, string $new = 'baru12345')
{
    return $browser->json('PUT', '/api/v1/me/password', [
        'current_password' => $current, 'password' => $new, 'password_confirmation' => $new,
    ]);
}

it('requires the current password', function () {
    changePassword($this->browser, 'salah12345')
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'current_password')
        ->assertJsonPath('errors.0.message', 'Kata sandi lama salah');

    expect(Hash::check('rahasia123', $this->customer->fresh()->password))->toBeTrue();
});

it('requires a new password different from the current one', function () {
    changePassword($this->browser, 'rahasia123', 'rahasia123')
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'password');
});

it('changes the password, keeps this session and signs out others', function () {
    $other = new Browser($this);
    $other->post('/api/v1/auth/login', ['email' => 'budi@example.test', 'password' => 'rahasia123'])->assertOk();
    $other->get('/api/v1/me')->assertOk();

    changePassword($this->browser, 'rahasia123')->assertOk();

    $this->browser->get('/api/v1/me')->assertOk();
    $other->get('/api/v1/me')->assertUnauthorized();
    expect(DB::table('audit_logs')->where('action', 'customer.password_changed')->count())->toBe(1);
});
