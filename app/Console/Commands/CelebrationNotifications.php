<?php

namespace App\Console\Commands;

use App\Models\HR\Employee;
use App\Notifications\PwaNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CelebrationNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:celebrations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatch daily notifications for birthdays and work anniversaries';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();
        
        $employees = Employee::where('is_active', true)
            ->where('hide_celebration', false)
            ->get();

        $activePeers = Employee::where('is_active', true)->get();

        foreach ($employees as $emp) {
            $dob = $emp->date_of_birth;
            $doj = $emp->date_of_joining;

            // 1. Check Birthday
            if ($dob && $dob->month === $today->month && $dob->day === $today->day) {
                $this->dispatchToPeers($emp, 'birthday', $activePeers);
            }

            // 2. Check Work Anniversary (3m, 6m, 1y+)
            if ($doj) {
                $diffInMonths = $doj->diffInMonths($today);
                $isToday = $doj->month === $today->month && $doj->day === $today->day;
                
                $milestone = null;
                if ($diffInMonths === 3 && $isToday) {
                    $milestone = '3 Monthly';
                } elseif ($diffInMonths === 6 && $isToday) {
                    $milestone = '6 Monthly';
                } elseif ($isToday && $today->year > $doj->year) {
                    $years = $today->year - $doj->year;
                    $milestone = $years . ($years > 1 ? ' Years' : ' Year');
                }

                if ($milestone) {
                    $this->dispatchToPeers($emp, 'anniversary', $activePeers, $milestone);
                }
            }
        }

        return Command::SUCCESS;
    }

    private function dispatchToPeers(Employee $celebrant, $type, $peers, $milestone = null)
    {
        $headline = $type === 'birthday' 
            ? "{$celebrant->full_name}: Birthday today! 🎂" 
            : "{$celebrant->full_name}: {$milestone} Work Anniversary! 🎊";

        $snippet = $type === 'birthday'
            ? "🎂 Let's say happy birthday, or Wish him/her a birthday."
            : "🥳 Let's celebrate this milestone! Send a warm wish.";

        $this->info("Dispatching {$type} notification for {$celebrant->full_name}");

        foreach ($peers as $peer) {
            // Don't notify the celebrant about themselves in the peer list
            if ($peer->id === $celebrant->id) continue;

            $peer->notify(new PwaNotification([
                'type' => 'announcement',
                'title' => $headline,
                'message' => $snippet,
                'pwa_action_url' => "/employee/celebrations/{$celebrant->id}?type={$type}",
                'data' => [
                    'category' => 'celebration',
                    'celebrant_id' => $celebrant->id,
                    'type' => $type,
                    'milestone' => $milestone,
                ]
            ]));
        }
    }
}
