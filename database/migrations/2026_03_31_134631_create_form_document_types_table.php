<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        if (!Schema::hasTable('form_document_types')) {
            Schema::create('form_document_types', function (Blueprint $table) {
                $table->ulid('id')->primary();
            $table->ulid('company_id')->index();
                $table->string('name');
                $table->string('slug');
                $table->boolean('is_active')->default(1);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_document_types');
    }
};
