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
        // 1. Rename the main table
        Schema::rename('job_card_replacement_types', 'job_card_damage_types');

        // 2. Update foreign keys and column names in job_cards
        Schema::table('job_cards', function (Blueprint $table) {
            $table->renameColumn('replacement_type_id', 'damage_type_id');
        });

        // 3. Update foreign keys and column names in job_card_damages
        Schema::table('job_card_damages', function (Blueprint $table) {
            $table->renameColumn('reason_id', 'damage_type_id');
        });

        // 4. Update foreign keys and column names in sales_order_items (if applicable)
        if (Schema::hasColumn('sales_order_items', 'replacement_type_id')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                $table->renameColumn('replacement_type_id', 'damage_type_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('sales_order_items', 'damage_type_id')) {
            Schema::table('sales_order_items', function (Blueprint $table) {
                $table->renameColumn('damage_type_id', 'replacement_type_id');
            });
        }

        Schema::table('job_card_damages', function (Blueprint $table) {
            $table->renameColumn('damage_type_id', 'reason_id');
        });

        Schema::table('job_cards', function (Blueprint $table) {
            $table->renameColumn('damage_type_id', 'replacement_type_id');
        });

        Schema::rename('job_card_damage_types', 'job_card_replacement_types');
    }
};
