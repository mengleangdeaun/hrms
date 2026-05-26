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
        Schema::create('crm_leads', function (Blueprint $table) {
            $table->id();
            $table->string('ulid', 36)->unique();
            $table->foreignId('contact_id')->constrained('crm_contacts')->cascadeOnDelete();
            $table->foreignId('stage_id')->constrained('crm_lead_pipeline_stages');
            $table->string('title');
            $table->decimal('expected_value', 15, 2)->default(0);
            $table->integer('probability')->default(0); // 0 to 100
            $table->string('source')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->date('expected_close_date')->nullable();
            $table->text('lost_reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
            
            $table->index('ulid');
            $table->index('assigned_to');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_leads');
    }
};
