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
        Schema::table('tma_broadcasts', function (Blueprint $table) {
            $table->string('aspect_ratio')->nullable()->after('image_url');
            $table->integer('delivered_count')->default(0)->after('total_recipients');
            $table->integer('failed_count')->default(0)->after('delivered_count');
            $table->integer('click_count')->default(0)->after('failed_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tma_broadcasts', function (Blueprint $table) {
            //
        });
    }
};
