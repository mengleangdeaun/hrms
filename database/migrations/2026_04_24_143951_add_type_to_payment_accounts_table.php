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
        Schema::table('payment_accounts', function (Blueprint $table) {
            $table->string('type')->after('name')->default('bank')->comment('bank, cash, e-wallet, etc.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_accounts', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
