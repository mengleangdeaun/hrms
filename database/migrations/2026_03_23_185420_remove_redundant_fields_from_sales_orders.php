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
        Schema::table('sales_orders', function (Blueprint $table) {
            // 1. Check and drop payment_account_id
            if (Schema::hasColumn('sales_orders', 'payment_account_id')) {
                // Drop the constraint FIRST by passing the column name in an array
                $table->dropForeign(['payment_account_id']);
                
                // Then drop the actual column
                $table->dropColumn('payment_account_id');
            }

            // 2. Check and drop receipt_path
            if (Schema::hasColumn('sales_orders', 'receipt_path')) {
                $table->dropColumn('receipt_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_orders', 'payment_account_id')) {
                // Note: I added ->constrained() so it actually rebuilds the foreign key if rolled back
                $table->foreignId('payment_account_id')->nullable()->after('payment_status')->constrained('payment_accounts');
            }
            
            if (!Schema::hasColumn('sales_orders', 'receipt_path')) {
                $table->string('receipt_path')->nullable()->after('payment_account_id');
            }
        });
    }
};