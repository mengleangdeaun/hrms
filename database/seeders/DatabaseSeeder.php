<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Default Company
        $company = \App\Models\Company::firstOrCreate(
            ['name' => 'Default Company']
        );

        // 2. Set the static property to auto-scope all seeded records to the default company
        \App\Traits\BelongsToCompany::$companyIdForSeeding = $company->id;

        $this->call([
            AccessControlSeeder::class,
            UserSeeder::class,
            TelegramBroadcastActionSeeder::class,
            DocumentTemplateSeeder::class,
        ]);
    }
}
