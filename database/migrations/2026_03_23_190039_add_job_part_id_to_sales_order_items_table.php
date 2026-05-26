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
        Schema::table('sales_order_items', function (Blueprint $table) {
            // Only add the column if it DOES NOT already exist
            if (!Schema::hasColumn('sales_order_items', 'job_part_id')) {
                $table->foreignId('job_part_id')->nullable()->after('itemable_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_order_items', function (Blueprint $table) {
            // Only try to drop the column if it DOES exist
            if (Schema::hasColumn('sales_order_items', 'job_part_id')) {
                $table->dropColumn(['job_part_id']);
            }
        });
    }
};