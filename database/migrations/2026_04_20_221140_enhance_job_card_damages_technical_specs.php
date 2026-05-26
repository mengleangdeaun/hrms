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
        Schema::table('job_card_damages', function (Blueprint $table) {
            // Make existing IDs nullable
            $table->foreignId('job_card_item_id')->nullable()->change();
            $table->foreignId('qc_report_id')->nullable()->change();

            // Add technical specs
            $table->foreignId('serial_id')->nullable()->after('reason_id')->constrained('inventory_product_serials');
            $table->decimal('width', 15, 4)->nullable()->after('serial_id');
            $table->decimal('height', 15, 4)->nullable()->after('width');
            $table->decimal('quantity', 15, 4)->nullable()->after('height');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_damages', function (Blueprint $table) {
            if (Schema::hasColumn('job_card_damages', 'serial_id')) {
                $table->dropForeign(['serial_id']);
                $table->dropColumn(['serial_id', 'width', 'height', 'quantity']);
            }
        });
    }
};
