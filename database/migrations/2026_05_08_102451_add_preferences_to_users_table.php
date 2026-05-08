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
        Schema::table('users', function (Blueprint $table) {
            $table->time('briefing_time')->default('08:00:00')->after('current_team_id');
            $table->string('ai_formality')->default('suroboyoan')->after('briefing_time'); // 'suroboyoan' or 'formal'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['briefing_time', 'ai_formality']);
        });
    }
};
