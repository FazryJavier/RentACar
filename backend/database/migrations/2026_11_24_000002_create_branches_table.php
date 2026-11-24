<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->string('address', 255);
            $table->string('city', 100);
            $table->string('phone', 20);
            $table->time('opening_time')->default('07:00');
            $table->time('closing_time')->default('21:00');
            $table->decimal('latitude', 9, 6);
            $table->decimal('longitude', 9, 6);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE branches ADD CONSTRAINT branches_hours_check CHECK (closing_time > opening_time)');
        DB::statement('ALTER TABLE branches ADD CONSTRAINT branches_latitude_check CHECK (latitude BETWEEN -90 AND 90)');
        DB::statement('ALTER TABLE branches ADD CONSTRAINT branches_longitude_check CHECK (longitude BETWEEN -180 AND 180)');
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
