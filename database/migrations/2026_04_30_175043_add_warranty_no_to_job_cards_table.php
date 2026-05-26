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
        Schema::table('job_cards', function (Blueprint $table) {
            $table->string('warranty_no')->nullable()->after('job_no')->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropColumn('warranty_no');
        });
    }
};
