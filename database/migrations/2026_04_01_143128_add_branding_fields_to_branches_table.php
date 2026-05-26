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
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'logo_url')) {
                $table->string('logo_url')->nullable()->after('email');
            }
            if (!Schema::hasColumn('branches', 'footer_text')) {
                $table->text('footer_text')->nullable()->after('logo_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['logo_url', 'footer_text']);
        });
    }
};
