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
        Schema::create('form_templates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('company_id')->index();
            $table->ulid('form_document_type_id')->constrained('form_document_types')->onDelete('cascade');
            $table->string('name');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active_for_print')->default(false);
            $table->string('page_size')->default('A4');
            $table->json('styles')->nullable();
            $table->json('layout_config')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_templates');
    }
};
