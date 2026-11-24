<?php

use App\Enums\BookingStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 16)->unique();
            $table->foreignId('customer_id')->constrained('customers')->restrictOnDelete();
            $table->foreignId('car_id')->constrained('cars')->restrictOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->restrictOnDelete();
            $table->foreignId('created_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestampTz('pickup_at');
            $table->timestampTz('return_at');
            $table->timestampTz('blocked_until');
            $table->string('status', 24)->default(BookingStatus::PendingPayment->value);
            $table->timestampTz('payment_deadline')->nullable();
            $table->smallInteger('payment_attempts')->default(0);
            $table->smallInteger('rental_days');
            $table->bigInteger('daily_price');
            $table->bigInteger('deposit');
            $table->bigInteger('rental_subtotal');
            $table->bigInteger('total_amount');
            $table->string('renter_name', 100);
            $table->string('renter_phone', 20);
            $table->string('renter_license_number', 16);
            $table->string('notes', 500)->nullable();
            $table->timestampTz('terms_accepted_at');
            $table->timestampTz('actual_pickup_at')->nullable();
            $table->timestampTz('actual_return_at')->nullable();
            $table->unsignedInteger('odometer_start')->nullable();
            $table->unsignedInteger('odometer_end')->nullable();
            $table->text('return_condition_notes')->nullable();
            $table->string('status_reason', 300)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();

            $table->index(['branch_id', 'status', 'pickup_at']);
            $table->index(['car_id', 'pickup_at']);
        });

        $checks = [
            'bookings_status_check' => 'status IN ('.BookingStatus::sqlList().')',
            'bookings_time_order_check' => 'return_at > pickup_at',
            'bookings_blocked_until_check' => 'blocked_until >= return_at',
            'bookings_rental_days_check' => 'rental_days BETWEEN 1 AND 30',
            'bookings_payment_attempts_check' => 'payment_attempts BETWEEN 0 AND 3',
            'bookings_amounts_check' => 'rental_subtotal = rental_days * daily_price AND total_amount = rental_subtotal + deposit',
            'bookings_money_non_negative_check' => 'daily_price > 0 AND deposit >= 0',
            'bookings_payment_deadline_check' => "status <> 'pending_payment' OR payment_deadline IS NOT NULL",
            'bookings_odometer_check' => 'odometer_end IS NULL OR odometer_start IS NULL OR odometer_end >= odometer_start',
        ];

        foreach ($checks as $name => $expression) {
            DB::statement("ALTER TABLE bookings ADD CONSTRAINT {$name} CHECK ({$expression})");
        }

        // A car cannot have two schedule-holding bookings whose [pickup_at, blocked_until) ranges overlap.
        DB::statement(
            'ALTER TABLE bookings ADD CONSTRAINT bookings_no_overlap '
            ."EXCLUDE USING gist (car_id WITH =, tstzrange(pickup_at, blocked_until, '[)') WITH &&) "
            .'WHERE (status IN ('.BookingStatus::holdingSqlList().'))'
        );

        DB::statement('CREATE INDEX bookings_customer_created_idx ON bookings (customer_id, created_at DESC)');
        DB::statement("CREATE INDEX bookings_pending_deadline_idx ON bookings (status, payment_deadline) WHERE status = 'pending_payment'");
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
