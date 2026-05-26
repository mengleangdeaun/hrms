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
            // Guard against existing columns to prevent "Duplicate column" errors 
            // if the DB state is out-of-sync with migrations files.
            
            if (!Schema::hasColumn('notifications', 'app_category')) {
                $table->string('app_category')->nullable()->after('type')->index()
                      ->default('crm');
            }

            if (!Schema::hasColumn('notifications', 'pwa_display_type')) {
                $table->string('pwa_display_type')->nullable()->after('app_category')->index()
                      ->comment('standard, top_banner, home_popup, home_image_section, none');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['pwa_display_type']);
            // We usually don't drop app_category if it was already there, 
            // but for a clean rollback if it was added by THIS migration:
            // $table->dropColumn(['app_category']); 
        });
    }
};
