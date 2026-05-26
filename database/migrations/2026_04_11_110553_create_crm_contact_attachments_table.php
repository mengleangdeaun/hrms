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
        Schema::create('crm_contact_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('crm_contacts')->cascadeOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->string('file_size')->nullable();
            $table->string('mime_type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_contact_attachments');
    }
};
