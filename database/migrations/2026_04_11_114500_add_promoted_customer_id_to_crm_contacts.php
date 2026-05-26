<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\CRM\Contact;
use App\Models\CRM\Customer;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('crm_contacts', function (Blueprint $table) {
            $table->foreignId('promoted_customer_id')->nullable()->after('is_converted')->constrained('customers')->nullOnDelete();
        });

        // Data Fix: Link existing contacts to their customer records by phone number
        $contacts = Contact::where('is_converted', false)->orWhereNull('promoted_customer_id')->get();

        foreach ($contacts as $contact) {
            if (!$contact->phone) continue;

            $customer = DB::table('customers')->where('phone', $contact->phone)->first();
            
            if ($customer) {
                $contact->update([
                    'is_converted' => true,
                    'promoted_customer_id' => $customer->id
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('crm_contacts', function (Blueprint $table) {
            $table->dropForeign(['promoted_customer_id']);
            $table->dropColumn('promoted_customer_id');
        });
    }
};
