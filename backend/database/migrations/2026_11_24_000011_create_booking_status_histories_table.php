<?php

use App\Enums\ActorType;
use App\Enums\BookingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->string('from_status', 24)->nullable();
            $table->string('to_status', 24);
            $table->string('actor_type', 10);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('reason', 300)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['booking_id', 'created_at']);
        });

        $statuses = BookingStatus::sqlList();
        DB::statement("ALTER TABLE booking_status_histories ADD CONSTRAINT booking_status_histories_from_check CHECK (from_status IS NULL OR from_status IN ({$statuses}))");
        DB::statement("ALTER TABLE booking_status_histories ADD CONSTRAINT booking_status_histories_to_check CHECK (to_status IN ({$statuses}))");
        DB::statement('ALTER TABLE booking_status_histories ADD CONSTRAINT booking_status_histories_actor_check CHECK (actor_type IN ('.ActorType::sqlList().'))');
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_status_histories');
    }
};
