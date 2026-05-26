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
        Schema::create('telegram_broadcast_actions', function (Blueprint $table) {
            $table->id();
            $table->string('action_key')->unique();
            $table->string('label');
            $table->string('category')->nullable(); // HR, Sales, Inventory, etc.
            $table->string('chat_id')->nullable();
            $table->string('topic_id')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->text('custom_remark')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telegram_broadcast_actions');
    }
};
