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
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->date('report_date');
            $table->json('data');
            $table->foreignId('submitted_by')->constrained('users');
            $table->boolean('telegram_sent')->default(false);
            $table->timestamps();

            $table->unique(['branch_id', 'report_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_reports');
    }
};
