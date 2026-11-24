<?php

use App\Enums\AdminRole;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email', 254);
            $table->string('password', 255);
            $table->string('role', 12)->default(AdminRole::Staff->value);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->restrictOnDelete();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestampTz('last_login_at')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement('ALTER TABLE admins ADD CONSTRAINT admins_role_check CHECK (role IN ('.AdminRole::sqlList().'))');
        DB::statement("ALTER TABLE admins ADD CONSTRAINT admins_role_branch_check CHECK ((role = 'super_admin' AND branch_id IS NULL) OR (role = 'staff' AND branch_id IS NOT NULL))");
        DB::statement('CREATE UNIQUE INDEX admins_email_lower_unique ON admins (lower(email)) WHERE deleted_at IS NULL');

        Schema::create('admin_password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestampTz('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_password_reset_tokens');
        Schema::dropIfExists('admins');
    }
};
