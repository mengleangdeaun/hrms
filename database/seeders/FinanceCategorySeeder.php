<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Finance\IncomeCategory;
use App\Models\Finance\ExpenseCategory;

class FinanceCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Income Categories
        $incomeCategories = [
            ['name' => 'Sales Revenue', 'description' => 'Revenue from direct product sales and services'],
            ['name' => 'Delivery Income', 'description' => 'Income from delivery services'],
            ['name' => 'Miscellaneous Income', 'description' => 'Other sources of income'],
        ];

        foreach ($incomeCategories as $cat) {
            IncomeCategory::updateOrCreate(['name' => $cat['name']], $cat);
        }

        // Expense Categories
        $expenseCategories = [
            ['name' => 'Cost of Goods Sold', 'description' => 'Direct costs attributable to the production of the goods sold'],
            ['name' => 'Utilities', 'description' => 'Electricity, water, internet, etc.'],
            ['name' => 'Rent', 'description' => 'Office or shop rent'],
            ['name' => 'Salaries', 'description' => 'Employee salaries and bonuses'],
            ['name' => 'Marketing', 'description' => 'Advertising and promotion expenses'],
            ['name' => 'Supplies', 'description' => 'Office and workshop supplies'],
            ['name' => 'Maintenance', 'description' => 'Equipment and facility maintenance'],
            ['name' => 'Miscellaneous Expense', 'description' => 'Other business expenses'],
        ];

        foreach ($expenseCategories as $cat) {
            ExpenseCategory::updateOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
