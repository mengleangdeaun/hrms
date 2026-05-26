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
        Schema::table('tma_broadcasts', function (Blueprint $table) {
            $table->string('button_text')->nullable()->after('aspect_ratio');
            $table->string('button_url')->nullable()->after('button_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tma_broadcasts', function (Blueprint $table) {
            $table->dropColumn(['button_text', 'button_url']);
        });
    }
};
