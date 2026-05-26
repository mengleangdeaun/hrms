<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\System\SystemActivityLog;

class ProcessSystemActivityLog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $data;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct(array $data)
    {
        $this->data = $this->cleanData($data);
    }

    /**
     * Recursive cleaner to ensure no non-serializable objects (like UploadedFile)
     * are stored in the job's data property.
     * Uses a depth limit to prevent stack overflows on large models.
     */
    private function cleanData(array $array, int $depth = 0): array
    {
        if ($depth > 5) return ['[DEPTH_LIMIT_REACHED]'];

        $result = [];
        foreach ($array as $key => $value) {
            if (is_array($value)) {
                $result[$key] = $this->cleanData($value, $depth + 1);
            } elseif (is_object($value)) {
                if ($value instanceof \Illuminate\Http\UploadedFile) {
                    $result[$key] = $value->getClientOriginalName() . ' (File Uploaded)';
                } elseif (method_exists($value, '__toString')) {
                    $result[$key] = (string) $value;
                } else {
                    $result[$key] = get_class($value) . ' [STRIPPED]';
                }
            } else {
                $result[$key] = $value;
            }
        }
        return $result;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle()
    {
        SystemActivityLog::create($this->data);
    }
}
