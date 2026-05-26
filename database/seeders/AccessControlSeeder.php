<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Auth\Role;
use App\Models\Auth\Permission;
use App\Models\Auth\User;
use Illuminate\Support\Str;

class AccessControlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Define Modules and Granular Permissions
        $modules = [
            'Dashboard' => [
                'view_sales', 'view_finance', 'view_crm', 'view_attendance', 'view_workshop', 'view_inventory'
            ],
            'HR Management' => [
                'view_hr', 'manage_branches', 'manage_departments', 'manage_designations', 'manage_document_types',
                'view_employees', 'create_employees', 'edit_employees', 'delete_employees', 'manage_employees',
                'manage_branch_employees', 'manage_award_types', 'manage_awards', 'manage_promotions',
                'manage_salary_movements', 'manage_resignations', 'manage_terminations', 'manage_warnings',
                'manage_holidays', 'view_hr_activity_log', 'manage_company_feedbacks', 'manage_announcements',
                'view_attendance_report'
            ],
            'Leave Management' => [
                'view_leave', 'manage_leave_types', 'manage_leave_policies', 'manage_leave_allocations', 
                'view_leave_records', 'manage_leave_records', 'view_leave_balances', 'manage_day_offs'
            ],
            'Attendance' => [
                'view_attendance', 'manage_working_shifts', 'manage_attendance_policies', 
                'view_attendance_records', 'manage_attendance_records', 'manage_employee_config', 'manage_branch_qr'
            ],
            'Inventory' => [
                'view_inventory', 'view_branch_products', 'view_branch_services', 'view_serials',
                'manage_inventory_categories', 'manage_uoms', 'manage_tags', 'manage_locations',
                'view_products', 'manage_products'
            ],
            'Procurement' => [
                'view_procurement', 'manage_suppliers', 'manage_purchase_orders', 'manage_purchase_receives'
            ],
            'Stock Management' => [
                'view_stock', 'view_stock_ledger', 'view_stock_balance', 'manage_stock_adjustments', 
                'manage_stock_transfers', 'view_stock_movements', 'view_serial_movements', 'view_off_cut_serials'
            ],
            'Sales & CRM' => [
                'view_sales', 'create_sales', 'manage_sales', 'access_pos', 'view_sales_orders', 'manage_sales_orders', 
                'view_sales_invoices', 'manage_sales_invoices', 'view_quotations', 'manage_quotations', 'manage_sale_remarks',
                'view_crm', 'manage_customer_types', 'view_customers', 'manage_customers', 
                'manage_customer_vehicles', 'manage_contacts', 'manage_leads', 'view_service_bookings', 
                'manage_service_bookings', 'view_customer_feedback', 'view_customer_ratings', 'manage_crm_settings'
            ],
            'Marketing' => [
                'view_tma_portal', 'manage_tma_banners', 'manage_tma_broadcast', 'manage_tma_settings'
            ],
            'Finance' => [
                'view_finance', 'manage_payment_accounts', 'manage_expenses', 'manage_incomes', 
                'view_transactions', 'manage_finance_categories'
            ],
            'Workshop' => [
                'view_workshop', 'view_job_cards', 'manage_job_cards', 'view_qc_reports', 
                'manage_qc_reports', 'view_damage_reports', 'manage_damage_reports', 'manage_damage_types',
                'manage_service_parts', 'manage_vehicle_brands', 'manage_vehicle_models'
            ],
            'Settings' => [
                'view_settings', 'manage_setup_data', 'view_system_logs', 'manage_telegram_settings',
                'manage_pwa_settings', 'manage_app_feedbacks', 'manage_branding', 'manage_templates'
            ],
            'Access Control' => [
                'view_users', 'create_users', 'edit_users', 'delete_users',
                'view_roles', 'create_roles', 'edit_roles', 'delete_roles'
            ],
            'Media' => [
                'access_media_library'
            ]
        ];

        $allPermissionIds = [];
        $permissionMap = [];
        $validSlugs = [];

        foreach ($modules as $module => $permissions) {
            foreach ($permissions as $slug) {
                $validSlugs[] = $slug;
                $permission = Permission::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => Str::title(str_replace('_', ' ', $slug)),
                        'module' => $module
                    ]
                );
                $allPermissionIds[] = $permission->id;
                $permissionMap[$slug] = $permission->id;
            }
        }

        // Prune stale permissions
        Permission::whereNotIn('slug', $validSlugs)->delete();

        // 2. Define Standard Roles and Assign Permissions
        $roles = [
            'super-admin' => [
                'name' => 'Super Admin',
                'description' => 'Full system access.',
                'permissions' => $allPermissionIds
            ],
            'manager' => [
                'name' => 'Manager',
                'description' => 'Oversees operations, HR, and reports.',
                'permissions' => $this->getPermissionsByPattern($permissionMap, ['view_', 'manage_', 'access_'], ['_users', '_roles', '_settings', 'telegram', 'pwa'])
            ],
            'staff' => [
                'name' => 'Staff',
                'description' => 'Daily operations and data entry.',
                'permissions' => array_merge(
                    $this->getPermissionsByPattern($permissionMap, ['view_'], ['_users', '_roles', '_settings', 'dashboard', 'finance', 'workshop', 'hr', 'leave', 'attendance', 'procurement', 'stock']),
                    $this->getPermissionsByPattern($permissionMap, ['access_pos', 'manage_customers', 'manage_leads'])
                )
            ],
            'hr-manager' => [
                'name' => 'HR Manager',
                'description' => 'Full access to HR, Attendance, and Leave.',
                'permissions' => $this->getPermissionsByModule($permissionMap, $modules, ['HR Management', 'Leave & Attendance'])
            ],
            'accountant' => [
                'name' => 'Accountant',
                'description' => 'Focused on Finance, Sales, and Procurement.',
                'permissions' => $this->getPermissionsByModule($permissionMap, $modules, ['Finance', 'Procurement', 'Sales & CRM'])
            ],
        ];

        foreach ($roles as $slug => $data) {
            $role = Role::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $data['name'],
                    'description' => $data['description']
                ]
            );
            $role->permissions()->sync($data['permissions']);
        }

        // 3. Assign Super Admin to first user
        $user = User::first();
        if ($user) {
            $superAdmin = Role::where('slug', 'super-admin')->first();
            $user->roles()->sync([$superAdmin->id]);
        }
    }

    /**
     * Helper to filter permissions by string patterns.
     */
    private function getPermissionsByPattern(array $map, array $includes, array $excludes = []): array
    {
        $filtered = [];
        foreach ($map as $slug => $id) {
            $matchInclude = false;
            foreach ($includes as $inc) {
                if (str_contains($slug, $inc)) {
                    $matchInclude = true;
                    break;
                }
            }

            if ($matchInclude) {
                $matchExclude = false;
                foreach ($excludes as $exc) {
                    if (str_contains($slug, $exc)) {
                        $matchExclude = true;
                        break;
                    }
                }
                if (!$matchExclude) {
                    $filtered[] = $id;
                }
            }
        }
        return $filtered;
    }

    /**
     * Helper to get all permissions belonging to specific modules.
     */
    private function getPermissionsByModule(array $map, array $modules, array $targetModules): array
    {
        $filtered = [];
        foreach ($targetModules as $moduleName) {
            if (isset($modules[$moduleName])) {
                foreach ($modules[$moduleName] as $slug) {
                    if (isset($map[$slug])) {
                        $filtered[] = $map[$slug];
                    }
                }
            }
        }
        return $filtered;
    }
}
