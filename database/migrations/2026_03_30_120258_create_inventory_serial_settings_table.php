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
        Schema::create('inventory_serial_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->unique()->constrained('branches')->onDelete('cascade');
            $table->string('prediction_mode')->default('per_product'); // off, global, per_product
            $table->boolean('auto_increment')->default(true);
            $table->string('prefix')->nullable();
            $table->boolean('keep_open')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_serial_settings');
    }
};
