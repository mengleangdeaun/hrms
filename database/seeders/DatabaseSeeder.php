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
        $this->call([
            AccessControlSeeder::class,
            UserSeeder::class,
            CustomerTypeSeeder::class,
            CRMDefaultSeeder::class,
            FinanceCategorySeeder::class,
            CarBrandModelSeeder::class,
            JobPartsSeeder::class,
            InventoryUomSeeder::class,
            SaleRemarkSeeder::class,
            TelegramBroadcastActionSeeder::class,
            DocumentTemplateSeeder::class,
        ]);
    }
}
