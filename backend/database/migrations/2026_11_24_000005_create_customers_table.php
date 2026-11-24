<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email', 254);
            $table->string('phone', 20);
            $table->string('password', 255);
            $table->string('address', 255)->nullable();
            $table->string('license_number', 16)->nullable();
            $table->boolean('is_blocked')->default(false);
            $table->string('blocked_reason', 300)->nullable();
            $table->timestampTz('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestampTz('last_login_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement('CREATE UNIQUE INDEX customers_email_lower_unique ON customers (lower(email)) WHERE deleted_at IS NULL');

        Schema::create('customer_password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_password_reset_tokens');
        Schema::dropIfExists('customers');
    }
};
