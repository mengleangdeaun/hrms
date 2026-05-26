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
            $table->string('in_status')->nullable()->after('clock_out_location');
            $table->string('out_status')->nullable()->after('in_status');
            $table->integer('early_minutes')->nullable()->after('late_minutes');
            $table->integer('warning_minutes')->nullable()->after('early_minutes');
            $table->integer('overtime_minutes')->nullable()->after('early_departure_minutes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn(['in_status', 'out_status', 'early_minutes', 'overtime_minutes']);
        });
    }
};
