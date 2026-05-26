<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_contacts', function (Blueprint $table) {
            $table->boolean('is_converted')->default(false)->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('crm_contacts', function (Blueprint $table) {
            $table->dropColumn('is_converted');
        });
    }
};
