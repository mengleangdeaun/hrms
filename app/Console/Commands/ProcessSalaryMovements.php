<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\HR\SalaryMovement;
use App\Models\HR\Employee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessSalaryMovements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hr:process-salary-movements';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process approved salary movements that have reached their effective date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting salary movement processing...');

        $movements = SalaryMovement::where('status', 'approved')
            ->where('is_applied', false)
            ->where('effective_date', '<=', now()->toDateString())
            ->get();

        if ($movements->isEmpty()) {
            $this->info('No pending salary movements to process.');
            return;
        }

        $processedCount = 0;

        foreach ($movements as $movement) {
            DB::beginTransaction();
            try {
                $employee = Employee::find($movement->employee_id);
                
                if ($employee) {
                    // Update the employee's main record
                    $employee->update([
                        'base_salary' => $movement->new_salary
                    ]);

                    // Mark movement as applied
                    $movement->update([
                        'is_applied' => true
                    ]);

                    $this->info("Successfully applied salary movement for Employee: {$employee->full_name} ({$employee->employee_id})");
                    $processedCount++;
                } else {
                    $this->error("Employee not found for movement ID: {$movement->id}");
                }
                
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error("Failed to process movement ID: {$movement->id}. Error: " . $e->getMessage());
                Log::error("Salary Movement Error: " . $e->getMessage(), ['movement_id' => $movement->id]);
            }
        }

        $this->info("Completed. Total movements processed: {$processedCount}");
    }
}
