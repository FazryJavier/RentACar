<?php

use App\Models\Admin;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\AdminBrowsers;

uses(RefreshDatabase::class);

function branchBody(array $overrides = []): array
{
    return [
        'name' => 'Jakarta Selatan',
        'address' => 'Jl. Contoh No. 1',
        'city' => 'Jakarta',
        'phone' => '+62 21-555-0100',
        'opening_time' => '07:00',
        'closing_time' => '21:00',
        'latitude' => -6.2,
        'longitude' => 106.816666,
        'is_active' => true,
        ...$overrides,
    ];
}

it('lets Super Admin create, update and delete branches', function () {
    $browser = AdminBrowsers::superAdmin($this);

    $created = $browser->post('/api/v1/admin/branches', branchBody())->assertCreated()
        ->assertJsonPath('data.slug', 'jakarta-selatan')
        ->assertJsonPath('data.phone', '62215550100')
        ->assertJsonPath('data.opening_time', '07:00')
        ->assertJsonPath('data.latitude', '-6.200000')
        ->assertJsonPath('data.longitude', '106.816666');
    $id = $created->json('data.id');

    $browser->json('PATCH', "/api/v1/admin/branches/{$id}", ['closing_time' => '22:00', 'version' => 1])
        ->assertOk()->assertJsonPath('data.closing_time', '22:00')->assertJsonPath('data.version', 2);

    $browser->json('DELETE', "/api/v1/admin/branches/{$id}")->assertOk();
});

it('lets Staf read branches but not change them', function () {
    $branch = Branch::factory()->create();
    $browser = AdminBrowsers::staff($this);

    $browser->get('/api/v1/admin/branches')->assertOk();
    $browser->get("/api/v1/admin/branches/{$branch->id}")->assertOk();
    $browser->post('/api/v1/admin/branches', branchBody())->assertForbidden()->assertJsonPath('errors.0.code', 'forbidden');
    $browser->json('PATCH', "/api/v1/admin/branches/{$branch->id}", ['name' => 'X', 'version' => 1])->assertForbidden();
    $browser->json('DELETE', "/api/v1/admin/branches/{$branch->id}")->assertForbidden();

    expect(Branch::query()->count())->toBe(2);
});

it('requires closing time after opening time', function (string $open, string $close) {
    AdminBrowsers::superAdmin($this)->post('/api/v1/admin/branches', branchBody(['opening_time' => $open, 'closing_time' => $close]))
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'closing_time')
        ->assertJsonPath('errors.0.message', 'Jam tutup harus setelah jam buka');
})->with([['21:00', '07:00'], ['08:00', '08:00']]);

it('checks the hours against the stored opening time on partial updates', function () {
    $branch = Branch::factory()->create(['opening_time' => '09:00', 'closing_time' => '17:00']);

    AdminBrowsers::superAdmin($this)->json('PATCH', "/api/v1/admin/branches/{$branch->id}", ['closing_time' => '08:30', 'version' => 1])
        ->assertUnprocessable()->assertJsonPath('errors.0.field', 'closing_time');
});

it('validates coordinates and phone', function (array $body, string $field) {
    AdminBrowsers::superAdmin($this)->post('/api/v1/admin/branches', branchBody($body))
        ->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
})->with([
    [['latitude' => 90.000001], 'latitude'],
    [['longitude' => -180.5], 'longitude'],
    [['phone' => '1234567'], 'phone'],
    [['phone' => 'abc-def-ghij'], 'phone'],
]);

it('refuses to delete a branch in use and lists every usage', function () {
    $branch = Branch::factory()->create();
    Car::factory()->count(2)->create(['branch_id' => $branch->id]);
    Admin::factory()->staff($branch)->create();
    Booking::factory()->count(5)->create(['branch_id' => $branch->id]);

    AdminBrowsers::superAdmin($this)->json('DELETE', "/api/v1/admin/branches/{$branch->id}")
        ->assertStatus(409)
        ->assertJsonPath('errors.0.details.usage', ['cars' => 2, 'admins' => 1, 'bookings' => 5])
        ->assertJsonPath('message', fn (string $m) => str_starts_with($m, 'Cabang masih dipakai 2 mobil, 1 admin, '));
});

it('audits branch changes', function () {
    $browser = AdminBrowsers::superAdmin($this, $admin);
    $id = $browser->post('/api/v1/admin/branches', branchBody(['name' => 'Jaksel']))->json('data.id');

    $browser->json('PATCH', "/api/v1/admin/branches/{$id}", ['name' => 'Jakarta Selatan', 'version' => 1])->assertOk();

    expect(DB::table('audit_logs')->where('action', 'admin.branch.created')->count())->toBe(1);
    $row = DB::table('audit_logs')->where('action', 'admin.branch.updated')->sole();
    expect(json_decode($row->changes, true)['name'])->toBe(['Jaksel', 'Jakarta Selatan'])
        ->and($row->actor_id)->toBe($admin->id);
});
