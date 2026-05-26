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
        Schema::table('crm_contacts', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('name');
            $table->char('parent_id', 26)->nullable()->after('company_name')->index();
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_contacts', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn(['company_name', 'parent_id']);
        });
    }
};
