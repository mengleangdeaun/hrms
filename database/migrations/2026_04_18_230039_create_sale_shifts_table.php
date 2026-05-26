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
        Schema::create('sale_shifts', function (Blueprint $table) {
            $table->id();
            $table->char('ulid', 26)->unique();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            
            // Stats at the time of closing
            $table->integer('total_sales_count')->default(0);
            $table->decimal('total_amount_collected', 15, 2)->default(0);
            $table->json('account_summary')->nullable(); // Breakdown by payment account
            
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['branch_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_shifts');
    }
};
