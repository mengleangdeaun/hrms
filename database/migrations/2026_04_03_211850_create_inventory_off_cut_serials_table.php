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
        Schema::create('inventory_off_cut_serials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('serial_number', 191)->nullable();
            $table->decimal('quantity', 15, 4)->default(0.0000);
            $table->decimal('width', 15, 4)->nullable();
            $table->decimal('height', 15, 4)->nullable();
            $table->unsignedBigInteger('branch_id')->nullable();
            $table->unsignedBigInteger('job_card_id')->nullable();
            $table->string('status', 191)->default('Available');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_off_cut_serials');
    }
};
