<?php

use App\Enums\PaymentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->smallInteger('attempt_no');
            $table->bigInteger('amount');
            $table->string('proof_path', 255);
            $table->string('proof_mime', 40);
            $table->unsignedInteger('proof_size');
            $table->string('status', 10)->default(PaymentStatus::Pending->value);
            $table->foreignId('reviewed_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestampTz('reviewed_at')->nullable();
            $table->string('reject_reason', 300)->nullable();
            $table->timestampsTz();

            $table->unique(['booking_id', 'attempt_no']);
            $table->index(['status', 'created_at']);
        });

        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('.PaymentStatus::sqlList().'))');
        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_mime_check CHECK (proof_mime IN ('image/jpeg', 'image/png', 'application/pdf'))");
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_proof_size_check CHECK (proof_size <= 2097152)');
        DB::statement('ALTER TABLE payments ADD CONSTRAINT payments_attempt_no_check CHECK (attempt_no BETWEEN 1 AND 3)');
        DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_reject_reason_check CHECK (status <> 'rejected' OR reject_reason IS NOT NULL)");
        DB::statement("CREATE UNIQUE INDEX payments_one_pending_per_booking ON payments (booking_id) WHERE status = 'pending'");
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
