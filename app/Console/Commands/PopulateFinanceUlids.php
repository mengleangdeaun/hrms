<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class PopulateFinanceUlids extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:populate-finance-ulids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tables = [
            'payment_accounts',
            'expenses',
            'expense_categories',
            'incomes',
            'income_categories',
            'payment_transactions',
        ];

        foreach ($tables as $table) {
            $this->info("Processing $table...");
            $records = \Illuminate\Support\Facades\DB::table($table)->whereNull('ulid')->get();
            foreach ($records as $record) {
                \Illuminate\Support\Facades\DB::table($table)->where('id', $record->id)->update([
                    'ulid' => (string) \Illuminate\Support\Str::ulid()
                ]);
            }
        }

        $this->info("Done!");
    }
}
