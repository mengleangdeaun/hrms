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
        Schema::table('attendance_records', function (Blueprint $table) {
            if (!Schema::hasColumn('attendance_records', 'session_1_out_time')) {
                $table->datetime('session_1_out_time')->nullable()->after('clock_in_time');
            }
            if (!Schema::hasColumn('attendance_records', 'session_2_in_time')) {
                $table->datetime('session_2_in_time')->nullable()->after('session_1_out_time');
            }
            if (!Schema::hasColumn('attendance_records', 'session_1_out_location')) {
                $table->string('session_1_out_location')->nullable()->after('clock_in_location');
            }
            if (!Schema::hasColumn('attendance_records', 'session_2_in_location')) {
                $table->string('session_2_in_location')->nullable()->after('session_1_out_location');
            }
            if (!Schema::hasColumn('attendance_records', 'late_reason')) {
                $table->text('late_reason')->nullable()->after('status');
            }
            if (!Schema::hasColumn('attendance_records', 'early_departure_reason')) {
                $table->text('early_departure_reason')->nullable()->after('late_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn([
                'session_1_out_time',
                'session_2_in_time',
                'session_1_out_location',
                'session_2_in_location',
                'late_reason',
                'early_departure_reason'
            ]);
        });
    }
};
