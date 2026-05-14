<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->integer('expiry_threshold_days')->default(3)->after('opening_balance');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->string('storage_type')->default('room_temp')->after('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('expiry_threshold_days');
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn('storage_type');
        });
    }
};
