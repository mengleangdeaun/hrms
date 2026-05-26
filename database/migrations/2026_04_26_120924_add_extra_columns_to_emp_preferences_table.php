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
        Schema::table('emp_preferences', function (Blueprint $table) {
            $table->boolean('location_enabled')->default(true)->after('notifications_enabled');
            $table->boolean('camera_enabled')->default(true)->after('location_enabled');
            $table->string('locale', 10)->default('en')->after('camera_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('emp_preferences', function (Blueprint $table) {
            $table->dropColumn(['location_enabled', 'camera_enabled', 'locale']);
        });
    }
};
