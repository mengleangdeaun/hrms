<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\CRM\Contact;
use App\Models\CRM\ContactCategory;
use App\Models\CRM\Customer;
use App\Models\Procurement\Supplier;
use Illuminate\Support\Str;

class MigrateExistingToCRM extends Command
{
    protected $signature = 'crm:migrate-existing';
    protected $description = 'Copy existing customers and suppliers to CRM contacts';

    public function handle()
    {
        $this->info('Starting migration to CRM contacts...');

        $clientCat = ContactCategory::where('slug', 'client')->first();
        $supplierCat = ContactCategory::where('slug', 'supplier')->first();

        if (!$clientCat || !$supplierCat) {
            $this->error('Contact categories not seeded. Please run CRMDefaultSeeder first.');
            return;
        }

        // 1. Process Customers
        $customers = Customer::all();
        $this->info("Found {$customers->count()} customers to process.");
        foreach ($customers as $customer) {
            $this->migrateContact($customer, $clientCat->id, 'individual');
        }

        // 2. Process Suppliers
        $suppliers = Supplier::all();
        $this->info("Found {$suppliers->count()} suppliers to process.");
        foreach ($suppliers as $supplier) {
            $this->migrateContact($supplier, $supplierCat->id, 'company');
        }

        $this->info('Migration completed successfully.');
    }

    private function migrateContact($source, $categoryId, $defaultType)
    {
        // Simple duplicate check by phone
        if ($source->phone && Contact::where('phone', $source->phone)->exists()) {
            $this->line("Skipping {$source->name} - Phone {$source->phone} already exists in Contacts.");
            return;
        }

        Contact::create([
            'ulid' => (string) Str::ulid(),
            'category_id' => $categoryId,
            'type' => $defaultType,
            'name' => $source->name,
            'email' => $source->email,
            'phone' => $source->phone,
            'address' => $source->address,
            'notes' => $source->notes ?? $source->note ?? null,
            'is_active' => $source->status === 'ACTIVE' || ($source->is_active ?? true),
        ]);

        $this->line("Migrated: {$source->name}");
    }
}
