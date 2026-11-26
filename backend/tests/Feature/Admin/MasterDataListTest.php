<?php

use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\AdminBrowsers;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->browser = AdminBrowsers::superAdmin($this);
});

it('searches, sorts and paginates brands on the server', function () {
    foreach (range(1, 12) as $i) {
        Brand::factory()->create(['name' => "Toyota {$i}", 'slug' => "toyota-{$i}"]);
    }
    Brand::factory()->create(['name' => 'Honda', 'slug' => 'honda']);

    $response = $this->browser->get('/api/v1/admin/brands?q=TOY&per_page=10&page=2&sort=-name')->assertOk();

    expect($response->json('meta'))->toBe(['page' => 2, 'per_page' => 10, 'total' => 12, 'total_pages' => 2])
        ->and(count($response->json('data')))->toBe(2)
        ->and($response->json('data.0.name'))->toBe('Toyota 10');
});

it('rejects a one-character search and unknown filters', function () {
    $this->browser->get('/api/v1/admin/brands?q=a')->assertUnprocessable()->assertJsonPath('errors.0.code', 'too_short');
    $this->browser->get('/api/v1/admin/brands?filter[is_active]=1')->assertUnprocessable()->assertJsonPath('errors.0.code', 'unknown_filter');
});

it('orders categories by sort order then name by default', function () {
    Category::factory()->create(['name' => 'B', 'slug' => 'b', 'sort_order' => 1]);
    Category::factory()->create(['name' => 'A', 'slug' => 'a', 'sort_order' => 1]);
    Category::factory()->create(['name' => 'Z', 'slug' => 'z', 'sort_order' => 0]);

    expect(array_column($this->browser->get('/api/v1/admin/categories')->json('data'), 'name'))->toBe(['Z', 'A', 'B']);
});

it('filters branches by status and city and searches the city', function () {
    Branch::factory()->create(['name' => 'Cabang A', 'city' => 'Bandung', 'is_active' => true]);
    Branch::factory()->create(['name' => 'Cabang B', 'city' => 'Bandung', 'is_active' => false]);
    Branch::factory()->create(['name' => 'Cabang C', 'city' => 'Jakarta', 'is_active' => true]);

    expect(count($this->browser->get('/api/v1/admin/branches?filter[is_active]=false')->json('data')))->toBe(1)
        ->and(count($this->browser->get('/api/v1/admin/branches?filter[city]=bandung')->json('data')))->toBe(2)
        ->and(count($this->browser->get('/api/v1/admin/branches?q=jakar')->json('data')))->toBe(1);
});

it('uses the admin page sizes', function () {
    $this->browser->get('/api/v1/admin/brands?per_page=7')->assertOk()->assertJsonPath('meta.per_page', 25);
});
