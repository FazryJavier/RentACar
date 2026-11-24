<?php

use App\Enums\AdminRole;
use App\Models\Admin;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Setting;
use Database\Seeders\ReferenceSeeder;
use Database\Seeders\SettingsSeeder;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'seeding.superadmin.email' => 'owner@example.test',
        'seeding.superadmin.password' => 'Sup3r-Secret-Seed',
    ]);
});

it('seeds every default setting', function () {
    $this->seed(SettingsSeeder::class);

    foreach (SettingsSeeder::defaults() as $key => $value) {
        // jsonb does not preserve object key order, so compare by value.
        expect(Setting::query()->find($key)?->value)->toEqual($value);
    }
});

it('never overwrites an edited setting', function () {
    $this->seed(SettingsSeeder::class);
    Setting::query()->whereKey('booking.payment_window_minutes')->update(['value' => json_encode(60)]);

    $this->seed(SettingsSeeder::class);

    expect(Setting::query()->find('booking.payment_window_minutes')->value)->toBe(60)
        ->and(Setting::query()->count())->toBe(count(SettingsSeeder::defaults()));
});

it('seeds reference data idempotently', function () {
    $this->seed(ReferenceSeeder::class);
    $this->seed(ReferenceSeeder::class);

    expect(Category::query()->count())->toBe(count(ReferenceSeeder::CATEGORIES))
        ->and(Brand::query()->count())->toBe(count(ReferenceSeeder::BRANDS))
        ->and(Category::query()->where('slug', 'city-car')->exists())->toBeTrue();
});

it('keeps admin edits to reference rows', function () {
    $this->seed(ReferenceSeeder::class);
    Category::query()->where('slug', 'suv')->update(['description' => 'Diubah admin']);

    $this->seed(ReferenceSeeder::class);

    expect(Category::query()->where('slug', 'suv')->value('description'))->toBe('Diubah admin');
});

it('creates exactly one super admin', function () {
    $this->seed(SuperAdminSeeder::class);
    $this->seed(SuperAdminSeeder::class);

    $admins = Admin::query()->whereRaw('lower(email) = ?', ['owner@example.test'])->get();

    expect($admins)->toHaveCount(1)
        ->and($admins[0]->role)->toBe(AdminRole::SuperAdmin)
        ->and($admins[0]->branch_id)->toBeNull()
        ->and(Hash::check('Sup3r-Secret-Seed', $admins[0]->password))->toBeTrue();
});

it('matches an existing super admin email case-insensitively', function () {
    Admin::factory()->superAdmin()->create(['email' => 'Owner@Example.test']);

    $this->seed(SuperAdminSeeder::class);

    expect(Admin::query()->count())->toBe(1);
});

it('refuses to seed without the environment variables', function (string $key, string $variable) {
    config(["seeding.superadmin.{$key}" => '']);

    expect(fn () => $this->seed(SuperAdminSeeder::class))->toThrow(RuntimeException::class, $variable);
    expect(Admin::query()->count())->toBe(0);
})->with([['email', 'SEED_SUPERADMIN_EMAIL'], ['password', 'SEED_SUPERADMIN_PASSWORD']]);

it('never prints the password', function () {
    Artisan::call('db:seed', ['--class' => SuperAdminSeeder::class, '--force' => true]);

    expect(Artisan::output())->toContain('owner@example.test')->not->toContain('Sup3r-Secret-Seed');
});

it('is safe to run the default seeder repeatedly', function () {
    $this->seed();
    $counts = [Setting::query()->count(), Category::query()->count(), Brand::query()->count(), Admin::query()->count()];

    $this->seed();

    expect([Setting::query()->count(), Category::query()->count(), Brand::query()->count(), Admin::query()->count()])->toBe($counts);
});
