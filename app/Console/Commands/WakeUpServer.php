<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class WakeUpServer extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:wake-up';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Pings the application URL to wake up the server from hibernation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $url = config('app.url') . '/api/health';
        $this->info("Pinging {$url}...");

        try {
            $response = Http::timeout(30)->get($url);
            if ($response->successful()) {
                $this->info('Server is awake!');
            } else {
                $this->error('Server returned an error: ' . $response->status());
            }
        } catch (\Exception $e) {
            $this->error('Failed to ping server: ' . $e->getMessage());
        }
    }
}
