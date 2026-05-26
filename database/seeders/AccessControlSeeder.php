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
                'view_attendance'
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
                    $this->getPermissionsByPattern($permissionMap, ['view_'], ['_users', '_roles', '_settings', 'dashboard', 'hr', 'leave', 'attendance'])
                )
            ],
            'hr-manager' => [
                'name' => 'HR Manager',
                'description' => 'Full access to HR, Attendance, and Leave.',
                'permissions' => $this->getPermissionsByModule($permissionMap, $modules, ['HR Management', 'Leave Management', 'Attendance'])
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
