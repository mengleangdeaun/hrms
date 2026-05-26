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
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->integer('warranty_duration')->nullable()->after('price');
            $table->string('warranty_unit')->nullable()->after('warranty_duration'); // days, weeks, months, years
            $table->integer('lifespan_duration')->nullable()->after('warranty_unit');
            $table->string('lifespan_unit')->nullable()->after('lifespan_duration'); // days, weeks, months, years
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->dropColumn(['warranty_duration', 'warranty_unit', 'lifespan_duration', 'lifespan_unit']);
        });
    }
};
