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
        Schema::create('tma_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->text('message');
            $table->text('image_url')->nullable();
            $table->foreignId('sender_id')->constrained('users');
            $table->integer('total_recipients')->default(0);
            $table->string('status')->default('sent');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tma_broadcasts');
    }
};
