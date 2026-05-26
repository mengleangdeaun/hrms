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
        Schema::table('employees', function (Blueprint $table) {
            $table->char('ulid', 26)->nullable()->after('id')->index();
        });

        // Populate existing records
        $employees = \DB::table('employees')->get();
        foreach ($employees as $employee) {
            \DB::table('employees')
                ->where('id', $employee->id)
                ->update(['ulid' => (string) \Illuminate\Support\Str::ulid()]);
        }

        Schema::table('employees', function (Blueprint $table) {
            $table->char('ulid', 26)->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('ulid');
        });
    }
};
