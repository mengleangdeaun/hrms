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
        Schema::create('customer_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null');
            
            $table->integer('customer_service_rating')->default(5);
            $table->integer('technical_team_rating')->default(5);
            $table->integer('overall_rating')->default(5);
            
            $table->json('issues')->nullable(); // ['Quality Issue', 'Staff Attitude', etc.]
            $table->text('other_issue_details')->nullable();
            
            $table->string('phone_number')->nullable();
            $table->text('improvement_suggestions')->nullable();
            $table->boolean('allow_contact')->default(false);
            
            $table->string('status')->default('pending'); // pending, reviewed, actioned
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_feedbacks');
    }
};
