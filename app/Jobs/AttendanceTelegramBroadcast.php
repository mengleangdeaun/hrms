<?php
 
namespace App\Jobs;
 
use App\Models\Attendance\AttendanceRecord;
use App\Services\TelegramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
 
class AttendanceTelegramBroadcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
 
    protected $actionKey;
    protected $record;
 
    /**
     * Create a new job instance.
     */
    public function __construct(string $actionKey, AttendanceRecord $record)
    {
        $this->actionKey = $actionKey;
        $this->record = $record;
    }
 
    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $cacheKey = "telegram_sent_atnd_{$this->record->id}_{$this->actionKey}";
        
        // Prevent duplicate notifications within 2 minutes
        // We use a small cache lock to avoid double messages from rapid scan + reason submission
        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return;
        }

        // We load the employee for formatting and refresh to get latest policy results
        $this->record->refresh();
        $this->record->load('employee', 'branch');
        
        $service = new TelegramService($this->record->branch_id);
        $service->broadcast($this->actionKey, $this->record);

        \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addMinutes(2));
    }
}
