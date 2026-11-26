<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Optimistic locking for brands and categories, like the other admin-editable tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('version');
        });

        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};
