<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

/*
| Runs on the guarded *_test database only (see Tests\TestCase). Rolls every migration back and
| applies them again to prove each down() works. Leaves the schema fully migrated.
*/

it('rolls back every migration and applies them again', function () {
    expect(Artisan::call('migrate', ['--force' => true]))->toBe(0);

    expect(Artisan::call('migrate:reset', ['--force' => true]))->toBe(0)
        ->and(Schema::hasTable('bookings'))->toBeFalse()
        ->and(Schema::hasTable('branches'))->toBeFalse();

    expect(Artisan::call('migrate', ['--force' => true]))->toBe(0)
        ->and(Schema::hasTable('bookings'))->toBeTrue()
        ->and(Schema::hasTable('testimonials'))->toBeTrue();
});
