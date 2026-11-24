<?php

use App\Enums\ConditionArea;
use App\Enums\ConditionSeverity;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('car_conditions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();
            $table->string('area', 12);
            $table->string('severity', 8);
            $table->string('description', 300);
            $table->jsonb('position')->nullable();
            $table->jsonb('normal')->nullable();
            $table->unsignedInteger('model_version')->nullable();
            $table->date('inspected_on');
            $table->boolean('is_resolved')->default(false);
            $table->timestampTz('resolved_at')->nullable();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestampsTz();

            $table->index(['car_id', 'is_resolved']);
        });

        DB::statement('ALTER TABLE car_conditions ADD CONSTRAINT car_conditions_area_check CHECK (area IN ('.ConditionArea::sqlList().'))');
        DB::statement('ALTER TABLE car_conditions ADD CONSTRAINT car_conditions_severity_check CHECK (severity IN ('.ConditionSeverity::sqlList().'))');
        DB::statement('ALTER TABLE car_conditions ADD CONSTRAINT car_conditions_description_check CHECK (char_length(description) >= 5)');
        DB::statement('ALTER TABLE car_conditions ADD CONSTRAINT car_conditions_position_check CHECK ((position IS NULL) = (model_version IS NULL))');

        Schema::create('car_condition_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_condition_id')->constrained('car_conditions')->cascadeOnDelete();
            $table->string('path', 255);
            $table->smallInteger('sort_order')->default(0);
            $table->timestampsTz();
        });

        Schema::create('car_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('cars')->cascadeOnDelete();
            // FK to bookings is added after the bookings table exists (see add_booking_fk_to_car_inspections).
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestampTz('inspected_at');
            $table->unsignedInteger('odometer_km');
            $table->text('notes')->nullable();
            $table->timestampsTz();
        });

        DB::statement('CREATE INDEX car_inspections_car_time_idx ON car_inspections (car_id, inspected_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('car_inspections');
        Schema::dropIfExists('car_condition_photos');
        Schema::dropIfExists('car_conditions');
    }
};
