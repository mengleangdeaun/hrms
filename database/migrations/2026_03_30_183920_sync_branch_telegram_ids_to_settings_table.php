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
        // 1. Sync data from branches to telegram_settings
        $branches = \Illuminate\Support\Facades\DB::table('branches')->get();
        foreach ($branches as $branch) {
            if ($branch->telegram_chat_id || $branch->telegram_topic_id) {
                \Illuminate\Support\Facades\DB::table('telegram_settings')->updateOrInsert(
                    ['branch_id' => $branch->id],
                    [
                        'global_chat_id'  => $branch->telegram_chat_id,
                        'global_topic_id' => $branch->telegram_topic_id,
                        'is_active'       => true,
                        'updated_at'      => now(),
                    ]
                );
            }
        }

        // 2. Schema cleanup
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['telegram_chat_id', 'telegram_topic_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->string('telegram_chat_id')->nullable();
            $table->string('telegram_topic_id')->nullable();
        });
    }
};
