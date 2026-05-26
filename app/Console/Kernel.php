<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('announcements:dispatch')->everyMinute();
        $schedule->command('announcements:expire')->everyMinute();
        $schedule->command('announcements:celebrations')->dailyAt('08:00');
        $schedule->command('hr:process-salary-movements')->dailyAt('00:00');
        $schedule->command('health:check')->daily();
        $schedule->command('health:prune --older-than-days=7')->daily();


        // Server Wake-up Alarms (Always Warm during the day)
        $schedule->command('app:wake-up')->at('06:30');
        $schedule->command('app:wake-up')->hourly()->between('07:00', '20:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
