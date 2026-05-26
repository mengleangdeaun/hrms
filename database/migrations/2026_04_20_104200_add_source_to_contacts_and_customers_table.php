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
        if (!Schema::hasColumn('crm_contacts', 'source')) {
            Schema::table('crm_contacts', function (Blueprint $table) {
                $table->string('source')->nullable()->after('type');
            });
        }

        if (!Schema::hasColumn('customers', 'source')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->string('source')->nullable()->after('type');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('crm_contacts', 'source')) {
            Schema::table('crm_contacts', function (Blueprint $table) {
                $table->dropColumn('source');
            });
        }

        if (Schema::hasColumn('customers', 'source')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn('source');
            });
        }
    }
};
