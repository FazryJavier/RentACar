<?php

use App\Http\Controllers\Api\V1\Admin\MasterData\CategoryController;
use App\Models\Car;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Support\AdminBrowsers;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->browser = AdminBrowsers::superAdmin($this);
});

it('creates categories with unique slugs', function () {
    $this->browser->post('/api/v1/admin/categories', ['name' => 'Mewah', 'description' => 'Mobil premium', 'sort_order' => 5])
        ->assertCreated()->assertJsonPath('data.slug', 'mewah')->assertJsonPath('data.sort_order', 5);
    $this->browser->post('/api/v1/admin/categories', ['name' => 'Mewah!'])
        ->assertCreated()->assertJsonPath('data.slug', 'mewah-2')->assertJsonPath('data.sort_order', 0);
});

it('validates description and sort order', function (array $body, string $field) {
    $this->browser->post('/api/v1/admin/categories', ['name' => 'Kategori Uji', ...$body])
        ->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
})->with([
    [['description' => str_repeat('a', 256)], 'description'],
    [['sort_order' => -1], 'sort_order'],
    [['sort_order' => 1000], 'sort_order'],
]);

it('rejects a duplicate name in any case', function () {
    Category::factory()->create(['name' => 'SUV', 'slug' => 'suv']);

    $this->browser->post('/api/v1/admin/categories', ['name' => 'suv'])
        ->assertUnprocessable()->assertJsonPath('errors.0.code', 'not_unique')->assertJsonPath('errors.0.message', 'Nama kategori sudah ada');
});

it('turns a concurrent duplicate into 422', function () {
    Category::factory()->create(['name' => 'City Car', 'slug' => 'city-car']);
    $controller = new ReflectionMethod(CategoryController::class, 'guardUniqueName');

    expect(fn () => $controller->invoke(app(CategoryController::class), fn () => Category::query()->create(['name' => 'CITY CAR', 'slug' => 'city-car-2']), 'Nama kategori sudah ada'))
        ->toThrow(ValidationException::class);
});

it('deletes an unused category and refuses a used one', function () {
    $unused = Category::factory()->create();
    $used = Category::factory()->create();
    Car::factory()->create(['category_id' => $used->id]);

    $this->browser->json('DELETE', "/api/v1/admin/categories/{$unused->id}")->assertOk();
    $this->browser->json('DELETE', "/api/v1/admin/categories/{$used->id}")
        ->assertStatus(409)->assertJsonPath('message', 'Kategori masih dipakai 1 mobil.');
});

it('updates with the current version and increments it', function () {
    $category = Category::factory()->create(['name' => 'MPV', 'slug' => 'mpv', 'sort_order' => 1]);

    $this->browser->json('PATCH', "/api/v1/admin/categories/{$category->id}", ['sort_order' => 2, 'version' => 1])
        ->assertOk()->assertJsonPath('data.sort_order', 2)->assertJsonPath('data.version', 2);
});
