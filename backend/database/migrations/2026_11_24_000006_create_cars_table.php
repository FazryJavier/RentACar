<?php

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 160)->unique();
            $table->foreignId('brand_id')->constrained('brands')->restrictOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->string('model_name', 80);
            $table->smallInteger('year');
            $table->string('plate_number', 12);
            $table->string('color', 30);
            $table->string('transmission', 12);
            $table->string('fuel_type', 12);
            $table->smallInteger('seats');
            $table->smallInteger('luggage_capacity')->nullable();
            $table->bigInteger('daily_price');
            $table->bigInteger('deposit')->default(0);
            $table->text('description')->nullable();
            $table->jsonb('features')->default('[]');
            $table->string('status', 12)->default(CarStatus::Active->value);
            $table->unsignedInteger('odometer_km')->default(0);
            $table->timestampTz('last_inspected_at')->nullable();
            $table->unsignedInteger('completed_bookings_count')->default(0);
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index(['branch_id', 'status']);
            $table->index('category_id');
            $table->index('brand_id');
            $table->index('daily_price');
        });

        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_transmission_check CHECK (transmission IN ('.Transmission::sqlList().'))');
        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_fuel_type_check CHECK (fuel_type IN ('.FuelType::sqlList().'))');
        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('.CarStatus::sqlList().'))');
        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_year_check CHECK (year BETWEEN 2000 AND 2100)');
        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_seats_check CHECK (seats BETWEEN 2 AND 16)');
        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_daily_price_check CHECK (daily_price BETWEEN 100000 AND 10000000)');
        DB::statement('ALTER TABLE cars ADD CONSTRAINT cars_deposit_check CHECK (deposit BETWEEN 0 AND 10000000)');
        DB::statement('CREATE UNIQUE INDEX cars_plate_number_unique ON cars (plate_number) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
