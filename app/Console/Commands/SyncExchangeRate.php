<?php

namespace App\Console\Commands;

use App\Http\Controllers\Settings\ExchangeRateController;
use App\Models\System\SystemSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncExchangeRate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exchange-rate:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize exchange rate with external provider if auto mode is enabled';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $mode = SystemSetting::get('exchange_rate_mode', 'manual');

        if ($mode !== 'auto') {
            $this->info('Exchange rate mode is set to manual. Skipping sync.');
            return;
        }

        $this->info('Starting exchange rate synchronization...');

        try {
            $controller = new ExchangeRateController();
            $response = $controller->syncLiveRate();
            $data = $response->getData(true);

            if (isset($data['error'])) {
                $this->error('Sync failed: ' . $data['error']);
                Log::error('Exchange Rate Auto Sync Failed: ' . $data['error']);
                return;
            }

            $this->info('Sync successful! New rate: ' . $data['rate']);
            Log::info('Exchange Rate Auto Sync Successful: ' . $data['rate']);

        } catch (\Exception $e) {
            $this->error('Sync failed: ' . $e->getMessage());
            Log::error('Exchange Rate Auto Sync Exception: ' . $e->getMessage());
        }
    }
}
