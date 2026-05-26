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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('name');
            $table->unsignedBigInteger('parent_id')->nullable()->after('company_name')->index();
            $table->string('type')->nullable()->after('parent_id')->index();

            $table->foreign('parent_id')->references('id')->on('customers')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['type']);
            $table->dropColumn(['company_name', 'parent_id', 'type']);
        });
    }
};
