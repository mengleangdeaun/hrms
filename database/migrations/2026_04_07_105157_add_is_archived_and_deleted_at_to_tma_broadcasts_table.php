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
            $table->boolean('is_archived')->default(false)->after('status');
            $table->softDeletes()->after('is_archived');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tma_broadcasts', function (Blueprint $table) {
            $table->dropColumn(['is_archived', 'deleted_at']);
        });
    }
};
