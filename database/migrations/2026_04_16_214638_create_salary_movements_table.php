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
        Schema::create('salary_movements', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('company_id')->index();
            $table->ulid('employee_id')->constrained('employees')->onDelete('cascade');
            $table->decimal('previous_salary', 15, 2)->default(0);
            $table->decimal('new_salary', 15, 2);
            $table->decimal('increment_amount', 15, 2)->default(0);
            $table->date('effective_date');
            $table->enum('type', ['increment', 'promotion', 'initial', 'adjustment'])->default('increment');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('source_type')->nullable();
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('is_applied')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_movements');
    }
};
