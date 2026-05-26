<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_day_offs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->json('days_off'); // e.g. ["Sunday"] or ["Saturday","Sunday"]
            $table->date('effective_from');
            $table->date('effective_to')->nullable(); // null = permanent/ongoing
            $table->foreignId('assigned_by')->nullable()->constrained('employees')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['employee_id', 'is_active']);
            $table->index(['effective_from', 'effective_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_day_offs');
    }
};
