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
        Schema::create('tma_broadcast_customer', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broadcast_id')->constrained('tma_broadcasts')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->boolean('is_viewed')->default(false);
            $table->timestamp('viewed_at')->nullable();
            $table->boolean('is_clicked')->default(false);
            $table->timestamp('clicked_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tma_broadcast_customer');
    }
};
