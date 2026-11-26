<?php

use App\Models\Brand;
use App\Models\Car;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\AdminBrowsers;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = null;
    $this->browser = AdminBrowsers::staff($this, $this->admin);
});

it('lets Staf create, update and delete a brand', function () {
    $created = $this->browser->post('/api/v1/admin/brands', ['name' => '  Toyota   Motor ']);
    $created->assertCreated()
        ->assertJsonPath('data.name', 'Toyota Motor')
        ->assertJsonPath('data.slug', 'toyota-motor')
        ->assertJsonPath('data.version', 1)
        ->assertJsonPath('data.logo_url', null);
    $id = $created->json('data.id');

    $this->browser->json('PATCH', "/api/v1/admin/brands/{$id}", ['name' => 'Toyota', 'version' => 1])
        ->assertOk()
        ->assertJsonPath('data.slug', 'toyota')
        ->assertJsonPath('data.version', 2);

    $this->browser->json('DELETE', "/api/v1/admin/brands/{$id}")->assertOk()->assertJsonPath('data', null);
    expect(Brand::query()->find($id))->toBeNull();
});

it('rejects a name taken in another letter case', function () {
    Brand::factory()->create(['name' => 'Toyota', 'slug' => 'toyota']);

    $this->browser->post('/api/v1/admin/brands', ['name' => 'TOYOTA'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.0.field', 'name')
        ->assertJsonPath('errors.0.code', 'not_unique')
        ->assertJsonPath('errors.0.message', 'Nama merek sudah ada');
});

it('keeps its own name when renaming other fields', function () {
    $brand = Brand::factory()->create(['name' => 'Honda', 'slug' => 'honda']);

    $this->browser->json('PATCH', "/api/v1/admin/brands/{$brand->id}", ['name' => 'HONDA', 'version' => 1])->assertOk();
});

it('validates the name length', function (string $name) {
    $this->browser->post('/api/v1/admin/brands', ['name' => $name])->assertUnprocessable()->assertJsonPath('errors.0.field', 'name');
})->with(['', 'A', str_repeat('a', 61)]);

it('requires a version on update and rejects a stale one', function () {
    $brand = Brand::factory()->create(['name' => 'Suzuki', 'slug' => 'suzuki']);

    $this->browser->json('PATCH', "/api/v1/admin/brands/{$brand->id}", ['name' => 'Suzuki X'])
        ->assertUnprocessable()->assertJsonPath('errors.0.field', 'version');

    $other = AdminBrowsers::superAdmin($this);
    $other->json('PATCH', "/api/v1/admin/brands/{$brand->id}", ['name' => 'Suzuki A', 'version' => 1])->assertOk();

    $this->browser->json('PATCH', "/api/v1/admin/brands/{$brand->id}", ['name' => 'Suzuki B', 'version' => 1])
        ->assertStatus(409)
        ->assertJsonPath('errors.0.code', 'version_conflict')
        ->assertJsonPath('message', 'Data sudah diubah admin lain. Muat ulang lalu coba lagi.');

    expect($brand->fresh()->name)->toBe('Suzuki A')->and($brand->fresh()->version)->toBe(2);
});

it('refuses to delete a brand used by cars and names the count', function () {
    $brand = Brand::factory()->create();
    Car::factory()->count(3)->create(['brand_id' => $brand->id]);

    $this->browser->json('DELETE', "/api/v1/admin/brands/{$brand->id}")
        ->assertStatus(409)
        ->assertJsonPath('errors.0.code', 'resource_in_use')
        ->assertJsonPath('errors.0.details.usage.cars', 3)
        ->assertJsonPath('message', 'Merek masih dipakai 3 mobil.');

    expect(Brand::query()->find($brand->id))->not->toBeNull();
});

it('audits changes with the admin and the changed fields', function () {
    $brand = Brand::factory()->create(['name' => 'Daihatsu', 'slug' => 'daihatsu']);

    $this->browser->json('PATCH', "/api/v1/admin/brands/{$brand->id}", ['name' => 'Daihatsu Baru', 'version' => 1])->assertOk();

    $row = DB::table('audit_logs')->where('action', 'admin.brand.updated')->sole();
    expect($row->actor_type)->toBe('admin')
        ->and($row->actor_id)->toBe($this->admin->id)
        ->and(json_decode($row->changes, true))->toMatchArray(['name' => ['Daihatsu', 'Daihatsu Baru'], 'slug' => ['daihatsu', 'daihatsu-baru']]);
});

it('answers 404 for unknown brands and 401 for customers', function () {
    $this->browser->get('/api/v1/admin/brands/999999')->assertNotFound();

    $customer = Customer::factory()->create(['password' => 'rahasia123']);
    $guest = new Browser($this);
    $guest->post('/api/v1/auth/login', ['email' => $customer->email, 'password' => 'rahasia123'])->assertOk();
    $guest->get('/api/v1/admin/brands')->assertUnauthorized();
});
