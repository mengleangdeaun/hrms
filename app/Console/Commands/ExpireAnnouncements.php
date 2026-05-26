<?php

namespace App\Console\Commands;

use App\Models\System\Announcement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Officialize status to expired for announcements that have reached their end_date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = now();

        $expiredCount = Announcement::where('status', 'published')
            ->whereNotNull('end_date')
            ->where('end_date', '<', $now)
            ->update(['status' => 'expired']);

        if ($expiredCount > 0) {
            $this->info("Successfully expired {$expiredCount} announcements.");
            Log::info("Announcements Autocut: Expired {$expiredCount} broadcasts based on end_date.");
        }

        return Command::SUCCESS;
    }
}
