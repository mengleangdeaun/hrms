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
        Schema::table('telegram_broadcast_actions', function (Blueprint $table) {
            $table->ulid('branch_id')->nullable()->after('id');
            $table->foreign('branch_id')->references('id')->on('branches')->onDelete('cascade');
            
            $table->dropUnique(['action_key']);
            $table->unique(['action_key', 'branch_id'], 'telegram_broadcast_actions_action_branch_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telegram_broadcast_actions', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropUnique('telegram_broadcast_actions_action_branch_unique');
            $table->unique(['action_key']);
            $table->dropColumn('branch_id');
        });
    }
};
