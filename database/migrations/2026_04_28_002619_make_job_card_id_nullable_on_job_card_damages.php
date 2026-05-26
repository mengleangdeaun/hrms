<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_card_damages', function (Blueprint $table) {
            $table->unsignedBigInteger('job_card_id')->nullable()->change();
            $table->unsignedBigInteger('job_card_item_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('job_card_damages', function (Blueprint $table) {
            $table->unsignedBigInteger('job_card_id')->nullable(false)->change();
            $table->unsignedBigInteger('job_card_item_id')->nullable(false)->change();
        });
    }
};
