<?php

use App\Enums\ActorType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 60)->primary();
            $table->jsonb('value');
            $table->foreignId('updated_by_admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestampTz('updated_at')->useCurrent();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor_type', 10);
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('action', 60);
            $table->string('subject_type', 60)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->jsonb('changes')->nullable();
            $table->jsonb('meta')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['subject_type', 'subject_id']);
        });

        DB::statement('ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_actor_check CHECK (actor_type IN ('.ActorType::sqlList().'))');
        DB::statement('CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_type, actor_id, created_at DESC)');
        DB::statement('CREATE INDEX audit_logs_action_idx ON audit_logs (action, created_at DESC)');

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40);
            $table->jsonb('properties')->default('{}');
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['name', 'created_at']);
        });

        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->string('name', 60);
            $table->string('city', 60)->nullable();
            $table->string('quote', 300);
            $table->smallInteger('rating')->default(5);
            $table->string('avatar_path', 255)->nullable();
            $table->boolean('is_demo')->default(true);
            $table->boolean('is_published')->default(true);
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE testimonials ADD CONSTRAINT testimonials_rating_check CHECK (rating BETWEEN 1 AND 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('events');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('settings');
    }
};
