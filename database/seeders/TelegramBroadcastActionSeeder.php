<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TelegramBroadcastActionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $actions = [
            // HR
            ['action_key' => 'hr.leave_requested', 'label' => 'New Leave Request', 'category' => 'HR'],
            ['action_key' => 'hr.leave_approved', 'label' => 'Leave Approved', 'category' => 'HR'],
            ['action_key' => 'hr.leave_rejected', 'label' => 'Leave Rejected', 'category' => 'HR'],
            ['action_key' => 'hr.employee_activity', 'label' => 'Employee Activity Log', 'category' => 'HR'],
            
            // Attendance
            ['action_key' => 'attendance.clock_in', 'label' => 'Employee Clock-In', 'category' => 'Attendance'],
            ['action_key' => 'attendance.clock_out', 'label' => 'Employee Clock-Out', 'category' => 'Attendance'],

            // System / Reports
            ['action_key' => 'system.daily_report', 'label' => 'Daily Operational Report', 'category' => 'System'],
        ];

        foreach ($actions as $action) {
            \App\Models\Communication\TelegramBroadcastAction::updateOrCreate(
                ['action_key' => $action['action_key']],
                ['label' => $action['label'], 'category' => $action['category'], 'is_enabled' => true]
            );
        }
    }
}
