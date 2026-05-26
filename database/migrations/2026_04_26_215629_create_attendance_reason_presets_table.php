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
        Schema::create('attendance_reason_presets', function (Blueprint $バランス) {
            $バランス->id();
            $バランス->string('reason_text');
            $バランス->enum('type', ['late', 'early', 'both'])->default('both');
            $バランス->boolean('is_active')->default(true);
            $バランス->integer('sort_order')->default(0);
            $バランス->timestamps();
        });

        // Add a global setting toggle to existing settings table if any, 
        // or we'll just handle it via the presence of active presets.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_reason_presets');
    }
};
