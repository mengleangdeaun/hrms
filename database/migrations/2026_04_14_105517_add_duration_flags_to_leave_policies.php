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
        Schema::table('leave_policies', function (Blueprint $table) {
            $table->boolean('allow_half_day')->default(false)->after('max_days_per_app');
            $table->boolean('allow_hourly')->default(false)->after('allow_half_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_policies', function (Blueprint $table) {
            $table->dropColumn(['allow_half_day', 'allow_hourly']);
        });
    }
};
