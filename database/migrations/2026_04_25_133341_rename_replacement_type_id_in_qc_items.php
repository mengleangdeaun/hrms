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
        Schema::table('job_card_qc_items', function (Blueprint $table) {
            $table->renameColumn('replacement_type_id', 'damage_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_qc_items', function (Blueprint $table) {
            $table->renameColumn('damage_type_id', 'replacement_type_id');
        });
    }
};
