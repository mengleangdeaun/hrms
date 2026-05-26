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
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('notifiable_type')->nullable()->after('employee_id');
            $table->string('notifiable_id')->nullable()->after('notifiable_type');
            // 'id' is already there as a bigIncrements, standard Laravel uses UUIDs for ID,
            // but we can stick with bigIncrements for now or change to string if needed.
            // Let's stick with what's there to avoid breaking ID references.
        });

        // Migrate existing data
        DB::table('notifications')->whereNotNull('employee_id')->update([
            'notifiable_type' => 'App\Models\HR\Employee',
            'notifiable_id' => DB::raw('employee_id')
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['notifiable_id', 'notifiable_type']);
        });
    }
};
