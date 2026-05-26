<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_settings', function (Blueprint $table) {

            if (!Schema::hasColumn('document_settings', 'date_format')) {
                $table->string('date_format')->nullable()->after('suffix');
            }

            if (!Schema::hasColumn('document_settings', 'separator')) {
                $table->string('separator', 5)->default('-')->after('date_format');
            }

        });
    }

    public function down(): void
    {
        Schema::table('document_settings', function (Blueprint $table) {

            if (Schema::hasColumn('document_settings', 'date_format')) {
                $table->dropColumn('date_format');
            }

            if (Schema::hasColumn('document_settings', 'separator')) {
                $table->dropColumn('separator');
            }

        });
    }
};
