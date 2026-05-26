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
        Schema::create('crm_contacts', function (Blueprint $table) {
            $table->id();
            $table->string('ulid', 36)->unique();
            $table->foreignId('category_id')->constrained('crm_contact_categories');
            $table->string('type', 50)->default('individual'); // individual, company, ngo, government
            $table->string('name');
            $table->string('position')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('google_map_link')->nullable();
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('country', 100)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
            
            $table->index('ulid');
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_contacts');
    }
};
