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
        Schema::table('notifications', function (Blueprint $table) {
            // Change id to string to support UUIDs from Laravel's Notification system.
            // Using string(36) to match standard UUID length.
            $table->string('id', 36)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Standard rollback: change back to big increments.
            // Warning: This may fail if UUIDs are present in the table.
            $table->bigIncrements('id')->change();
        });
    }
};
