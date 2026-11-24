<?php

namespace Database\Seeders;

use App\Enums\AdminRole;
use App\Models\Admin;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * Creates the first Super Admin from SEED_SUPERADMIN_EMAIL / SEED_SUPERADMIN_PASSWORD.
 * Refuses empty values, never duplicates, never prints the password.
 */
class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = trim((string) config('seeding.superadmin.email'));
        $password = (string) config('seeding.superadmin.password');

        foreach (['SEED_SUPERADMIN_EMAIL' => $email, 'SEED_SUPERADMIN_PASSWORD' => $password] as $variable => $value) {
            if ($value === '') {
                throw new RuntimeException("{$variable} is empty. Set it in backend/.env before seeding the Super Admin.");
            }
        }

        $exists = Admin::withTrashed()
            ->whereRaw('lower(email) = ?', [mb_strtolower($email)])
            ->exists();

        if ($exists) {
            $this->command?->info("Super Admin {$email} already exists; left unchanged.");

            return;
        }

        Admin::query()->create([
            'name' => (string) config('seeding.superadmin.name', 'Super Admin'),
            'email' => $email,
            'password' => $password,
            'role' => AdminRole::SuperAdmin,
            'branch_id' => null,
            'is_active' => true,
        ]);

        $this->command?->info("Super Admin {$email} created.");
    }
}
