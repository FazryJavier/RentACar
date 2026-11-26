<?php

namespace Tests\Support;

use App\Models\Admin;
use App\Models\Branch;
use Tests\TestCase;

/**
 * Signed-in admin browsers for admin feature tests.
 */
final class AdminBrowsers
{
    public static function superAdmin(TestCase $test, ?Admin &$admin = null): Browser
    {
        $admin = Admin::factory()->superAdmin()->create(['password' => 'rahasia123']);

        return self::login($test, $admin);
    }

    public static function staff(TestCase $test, ?Admin &$admin = null, ?Branch $branch = null): Browser
    {
        $admin = Admin::factory()->staff($branch)->create(['password' => 'rahasia123']);

        return self::login($test, $admin);
    }

    public static function login(TestCase $test, Admin $admin): Browser
    {
        $browser = new Browser($test);
        $browser->post('/api/v1/admin/auth/login', ['email' => $admin->email, 'password' => 'rahasia123'])->assertOk();

        return $browser;
    }
}
