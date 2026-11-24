<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('car_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();
            $table->string('path', 255);
            $table->jsonb('variants')->default('{}');
            $table->string('alt_text', 160);
            $table->smallInteger('sort_order')->default(0);
            $table->timestampsTz();

            $table->index(['car_id', 'sort_order']);
        });

        Schema::create('car_models_3d', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->unique()->constrained('cars')->cascadeOnDelete();
            $table->string('file_path', 255);
            $table->unsignedInteger('file_size');
            $table->string('poster_path', 255)->nullable();
            $table->jsonb('camera')->default('{}');
            $table->string('source_name', 120);
            $table->string('source_url', 500)->nullable();
            $table->string('license', 60);
            $table->boolean('is_illustrative')->default(false);
            $table->unsignedInteger('model_version')->default(1);
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE car_models_3d ADD CONSTRAINT car_models_3d_file_size_check CHECK (file_size <= 15728640)');
    }

    public function down(): void
    {
        Schema::dropIfExists('car_models_3d');
        Schema::dropIfExists('car_photos');
    }
};
