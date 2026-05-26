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
        $tables = [
            'payment_accounts',
            'expenses',
            'expense_categories',
            'incomes',
            'income_categories',
            'payment_transactions',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->ulid('ulid')->nullable()->unique()->after('id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'payment_accounts',
            'expenses',
            'expense_categories',
            'incomes',
            'income_categories',
            'payment_transactions',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('ulid');
            });
        }
    }
};
