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
        Schema::create('employee_wishes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('company_id')->index();
            $table->ulid('sender_id');
            $table->ulid('receiver_id');
            $table->enum('type', ['birthday', 'anniversary']);
            $table->text('message')->nullable();
            $table->string('image_path')->nullable();
            $table->integer('year');
            $table->timestamp('viewed_at')->nullable();
            $table->timestamps();

            $table->foreign('sender_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('receiver_id')->references('id')->on('employees')->onDelete('cascade');
            
            // Prevent duplicate wishes from the same person for the same event in a single year
            $table->unique(['sender_id', 'receiver_id', 'type', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_wishes');
    }
};
