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
        Schema::table('employee_day_offs', function (Blueprint $table) {
            $table->string('frequency')->default('weekly')->after('days_off');
            $table->json('weeks_of_month')->nullable()->after('frequency');
            $table->json('specific_dates')->nullable()->after('weeks_of_month');
        });

        Schema::table('day_off_requests', function (Blueprint $table) {
            $table->string('frequency')->default('weekly')->after('requested_days_off');
            $table->json('weeks_of_month')->nullable()->after('frequency');
            $table->json('specific_dates')->nullable()->after('weeks_of_month');
        });
    }

    public function down(): void
    {
        Schema::table('employee_day_offs', function (Blueprint $table) {
            $table->dropColumn(['frequency', 'weeks_of_month', 'specific_dates']);
        });

        Schema::table('day_off_requests', function (Blueprint $table) {
            $table->dropColumn(['frequency', 'weeks_of_month', 'specific_dates']);
        });
    }
};
