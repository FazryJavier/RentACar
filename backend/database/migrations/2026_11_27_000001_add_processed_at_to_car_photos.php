<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('car_photos', function (Blueprint $table) {
            // NULL while the queued job is still creating the WebP variants.
            $table->timestampTz('processed_at')->nullable();
        });

        DB::table('car_photos')->update(['processed_at' => DB::raw('now()')]);
    }

    public function down(): void
    {
        Schema::table('car_photos', function (Blueprint $table) {
            $table->dropColumn('processed_at');
        });
    }
};
