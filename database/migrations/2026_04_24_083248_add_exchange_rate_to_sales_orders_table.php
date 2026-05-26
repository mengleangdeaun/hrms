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
            $table->decimal('exchange_rate', 15, 2)->default(4100)->after('balance_amount');
            $table->decimal('subtotal_khr', 15, 2)->default(0)->after('exchange_rate');
            $table->decimal('grand_total_khr', 15, 2)->default(0)->after('subtotal_khr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate', 'subtotal_khr', 'grand_total_khr']);
        });
    }
};
