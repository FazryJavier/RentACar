<?php

use App\Models\Brand;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('versions brands and categories from 1', function () {
    expect(Schema::hasColumn('brands', 'version'))->toBeTrue()
        ->and(Schema::hasColumn('categories', 'version'))->toBeTrue()
        ->and(Brand::factory()->create()->fresh()->version)->toBe(1)
        ->and(Category::factory()->create()->fresh()->version)->toBe(1);
});
