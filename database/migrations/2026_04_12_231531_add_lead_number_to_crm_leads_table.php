<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('crm_leads', function (Blueprint $table) {
            $table->string('lead_number', 50)->nullable()->unique()->after('ulid');
        });

        // Populate existing leads
        $leads = DB::table('crm_leads')->orderBy('id')->get();
        foreach ($leads as $index => $lead) {
            $number = 'LD-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT);
            DB::table('crm_leads')->where('id', $lead->id)->update([
                'lead_number' => $number
            ]);
        }
        
        // Make it non-nullable after population if needed, 
        // but since we might create settings later, nullable is safer for a moment
        // Actually, we should make it required for future.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_leads', function (Blueprint $table) {
            $table->dropColumn('lead_number');
        });
    }
};
