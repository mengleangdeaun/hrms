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
            // Sales
            ['action_key' => 'sales.order_created', 'label' => 'New Sales Order', 'category' => 'Sales'],
            ['action_key' => 'sales.order_cancelled', 'label' => 'Sales Order Cancelled', 'category' => 'Sales'],
            ['action_key' => 'sales.payment_received', 'label' => 'Payment Received (Sale)', 'category' => 'Sales'],
            ['action_key' => 'sales.shift_opened', 'label' => 'Sale Shift Opened', 'category' => 'Sales'],
            ['action_key' => 'sales.shift_closed', 'label' => 'Sale Shift Closed (Summary)', 'category' => 'Sales'],
            
            // Procurement
            ['action_key' => 'procurement.po_created', 'label' => 'New Purchase Order', 'category' => 'Procurement'],
            ['action_key' => 'procurement.receive_completed', 'label' => 'Stock Received', 'category' => 'Procurement'],
            
            // Services
            ['action_key' => 'services.job_status_updated', 'label' => 'Job Card Status Update', 'category' => 'Services'],
            ['action_key' => 'services.job_completed', 'label' => 'Job Card Completed', 'category' => 'Services'],
            ['action_key' => 'services.qc_passed', 'label' => 'QC Audit Passed', 'category' => 'Services'],
            ['action_key' => 'services.qc_failed', 'label' => 'QC Audit Failed', 'category' => 'Services'],
            ['action_key' => 'services.damage_reported', 'label' => 'New Damage Report', 'category' => 'Services'],
            
            // HR
            ['action_key' => 'hr.leave_requested', 'label' => 'New Leave Request', 'category' => 'HR'],
            ['action_key' => 'hr.leave_approved', 'label' => 'Leave Approved', 'category' => 'HR'],
            ['action_key' => 'hr.leave_rejected', 'label' => 'Leave Rejected', 'category' => 'HR'],
            ['action_key' => 'hr.employee_activity', 'label' => 'Employee Activity Log', 'category' => 'HR'],
            
            // Attendance
            ['action_key' => 'attendance.clock_in', 'label' => 'Employee Clock-In', 'category' => 'Attendance'],
            ['action_key' => 'attendance.clock_out', 'label' => 'Employee Clock-Out', 'category' => 'Attendance'],
            
            // Inventory
            ['action_key' => 'inventory.stock_adjustment', 'label' => 'New Stock Adjustment', 'category' => 'Inventory'],
            ['action_key' => 'inventory.stock_transfer', 'label' => 'New Stock Transfer', 'category' => 'Inventory'],

            // CRM
            ['action_key' => 'crm.customer_feedback_received', 'label' => 'New Customer Feedback', 'category' => 'CRM'],
            ['action_key' => 'crm.job_card_rating_received', 'label' => 'New Job Card Rating', 'category' => 'CRM'],
            ['action_key' => 'crm.booking_created', 'label' => 'New Service Booking', 'category' => 'CRM'],
            ['action_key' => 'crm.booking_updated', 'label' => 'Booking Status Updated', 'category' => 'CRM'],

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
