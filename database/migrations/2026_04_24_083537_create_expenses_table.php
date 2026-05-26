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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_category_id')->constrained('expense_categories')->onDelete('cascade');
            $table->foreignId('payment_account_id')->constrained('payment_accounts')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->dateTime('date');
            $table->string('description')->nullable();
            $table->string('receipt_path')->nullable();
            $table->foreignId('payment_transaction_id')->nullable()->constrained('payment_transactions')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
