<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Safe, repeatable seeding for every environment: it only inserts what is missing
     * and never truncates or deletes. Demo data is added by a separate, environment-guarded seeder.
     */
    public function run(): void
    {
        $this->call([
            SettingsSeeder::class,
            ReferenceSeeder::class,
            SuperAdminSeeder::class,
        ]);
    }
}
