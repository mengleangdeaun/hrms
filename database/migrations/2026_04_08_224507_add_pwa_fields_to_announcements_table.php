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
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('pwa_display_type')->nullable()->after('status')->comment('top_banner, home_popup, home_image_section');
            $table->string('pwa_action_label')->nullable()->after('pwa_display_type');
            $table->string('pwa_action_url')->nullable()->after('pwa_action_label');
            $table->boolean('pwa_show_once')->default(true)->after('pwa_action_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['pwa_display_type', 'pwa_action_label', 'pwa_action_url', 'pwa_show_once']);
        });
    }
};
