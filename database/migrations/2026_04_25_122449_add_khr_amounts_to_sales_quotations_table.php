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
        Schema::table('sales_quotations', function (Blueprint $table) {
            $table->decimal('subtotal_khr', 15, 2)->default(0)->after('exchange_rate');
            $table->decimal('grand_total_khr', 15, 2)->default(0)->after('subtotal_khr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_quotations', function (Blueprint $table) {
            $table->dropColumn(['subtotal_khr', 'grand_total_khr']);
        });
    }
};
