export interface MenuItem {
    title: string;
    path: string;
    category: string;
    permission?: string;
    keywords?: string[];
    shortcut?: string;
}

export const menuItems: MenuItem[] = [
    // Dashboard
    { title: 'attendance_dashboard', path: '/dashboard/attendance', category: 'dashboard', permission: 'view_attendance', keywords: ['hr', 'clock', 'time', 'វត្តមាន'] },

    // HR Management
    { title: 'branches', path: '/hr/branches', category: 'hr_management', permission: 'manage_branches', keywords: ['location', 'office', 'store', 'សាខា'], shortcut: 'Alt + B' },
    { title: 'departments', path: '/hr/departments', category: 'hr_management', permission: 'manage_departments', keywords: ['នាយកដ្ឋាន'] },
    { title: 'designations', path: '/hr/designations', category: 'hr_management', permission: 'manage_designations', keywords: ['position', 'title', 'rank', 'តំណែង'] },
    { title: 'document_types', path: '/hr/document-types', category: 'hr_management', permission: 'manage_document_types', keywords: ['ប្រភេទឯកសារ'] },
    { title: 'employees', path: '/hr/employees', category: 'hr_management', permission: 'view_employees', keywords: ['staff', 'people', 'users', 'បុគ្គលិក'], shortcut: 'Alt + E' },
    { title: 'branch_employees', path: '/hr/branch-employees', category: 'hr_management', permission: 'manage_branch_employees', keywords: ['មេជាង', 'ជាង', 'បុគ្គលិក']  },
    { title: 'award_types', path: '/hr/award-types', category: 'hr_management', permission: 'manage_award_types' },
    { title: 'awards', path: '/hr/awards', category: 'hr_management', permission: 'manage_awards', keywords: ['recognition', 'gift', 'prize'] },
    { title: 'promotions', path: '/hr/promotions', category: 'hr_management', permission: 'manage_promotions', keywords: ['career', 'upgrade', 'rank'] },
    { title: 'salary_movements', path: '/hr/salary-movements', category: 'hr_management', permission: 'manage_salary_movements', keywords: ['pay', 'adjustment', 'wage'] },
    { title: 'resignations', path: '/hr/resignations', category: 'hr_management', permission: 'manage_resignations', keywords: ['quit', 'leave', 'exit'] },
    { title: 'terminations', path: '/hr/terminations', category: 'hr_management', permission: 'manage_terminations', keywords: ['fire', 'dismiss', 'exit'] },
    { title: 'warnings', path: '/hr/warnings', category: 'hr_management', permission: 'manage_warnings', keywords: ['disciplinary', 'notice', 'caution'] },
    { title: 'holidays', path: '/hr/holidays', category: 'hr_management', permission: 'manage_holidays', keywords: ['vacation', 'off', 'calendar'] },
    { title: 'activity_log', path: '/hr/activities', category: 'hr_management', permission: 'view_hr_activity_log', keywords: ['history', 'audit', 'logs'], shortcut: 'Alt + G' },
    { title: 'feedbacks', path: '/hr/company-feedbacks', category: 'hr_management', permission: 'manage_company_feedbacks', keywords: ['suggestion', 'complaint', 'opinion'] },
    { title: 'announcements', path: '/hr/announcements', category: 'hr_management', permission: 'manage_announcements', keywords: ['news', 'broadcast', 'notice'] },

    // Leave Management
    { title: 'leave_types', path: '/hr/leave-types', category: 'leave_management', permission: 'manage_leave_types' },
    { title: 'leave_policies', path: '/hr/leave-policies', category: 'leave_management', permission: 'manage_leave_policies' },
    { title: 'leave_allocations', path: '/hr/leave-allocations', category: 'leave_management', permission: 'manage_leave_allocations' },
    { title: 'leave_records', path: '/hr/leave-records', category: 'leave_management', permission: 'manage_leave_records' },
    { title: 'leave_balances', path: '/hr/leave-balances', category: 'leave_management', permission: 'view_leave_balances' },
    { title: 'day_offs', path: '/hr/day-offs', category: 'leave_management', permission: 'manage_day_offs', keywords: ['day off', 'rest day', 'ថ្ងៃឈប់'] },

    // Attendance
    { title: 'working_shifts', path: '/attendance/working-shifts', category: 'attendance', permission: 'manage_working_shifts' },
    { title: 'attendance_policies', path: '/attendance/attendance-policies', category: 'attendance', permission: 'manage_attendance_policies' },
    { title: 'reason_presets', path: '/attendance/reason-presets', category: 'attendance', permission: 'manage_attendance_policies' },
    { title: 'attendance_records', path: '/attendance/records', category: 'attendance', permission: 'manage_attendance_records', shortcut: 'Alt + A' },
    { title: 'daily_action_report', path: '/report/action', category: 'attendance', permission: 'view_attendance_report', keywords: ['action report', 'daily action', 'attendance timeline'] },
    { title: 'action_log_overview', path: '/report/action-overview', category: 'attendance', permission: 'view_attendance_report', keywords: ['action overview', 'action log', 'audit log'] },
    { title: 'employee_config', path: '/attendance/employee-config', category: 'attendance', permission: 'manage_employee_config' },
    { title: 'branch_qr_setup', path: '/attendance/branch-qr', category: 'attendance', permission: 'manage_branch_qr' },

    // Setup & Settings
    { title: 'template_builder', path: '/settings/templates', category: 'settings', permission: 'manage_templates' },
    { title: 'form_document_types', path: '/settings/document-types', category: 'settings', permission: 'manage_templates' },
    { title: 'branding', path: '/settings/branding', category: 'settings', permission: 'manage_branding' },
    { title: 'system_logs', path: '/settings/system-logs', category: 'settings', permission: 'view_system_logs', shortcut: 'Alt + G' },
    { title: 'telegram_settings', path: '/settings/telegram-settings', category: 'settings', permission: 'manage_telegram_settings' },
    { title: 'pwa_settings', path: '/settings/pwa-settings', category: 'settings', permission: 'manage_pwa_settings' },
    { title: 'app_feedback', path: '/settings/pwa-feedbacks', category: 'settings', permission: 'manage_app_feedbacks' },
    { title: 'attendance_report', path: '/report/attendance', category: 'reports', permission: 'view_attendance_report' },
    { title: 'profile', path: '/users/profile', category: 'user' },
    { title: 'preferences', path: '/users/preferences', category: 'user' },
    { title: 'media_library', path: '/apps/media-library', category: 'apps', permission: 'access_media_library', shortcut: 'Alt + M' },
    { title: 'users_management', path: '/access-control/users', category: 'access_control', permission: 'view_users' },
    { title: 'roles_and_permissions', path: '/access-control/roles', category: 'access_control', permission: 'view_roles', keywords: ['សិទ្ធិ'] },
    { title: 'document_search', path: '/support/documentation', category: 'support', permission: 'view_hr', keywords: ['help', 'guide', 'manual', 'docs', 'search', 'ឯកសារ', 'ស្វែងរក', 'ជំនួយ', 'shortcut'], shortcut: 'Alt + D' },
    { title: 'shortcut_keys', path: '/support/shortcuts', category: 'support', permission: 'view_hr', keywords: ['hotkeys', 'keyboard', 'shortcuts', 'ជំនួយ', 'គ្រាប់ចុច'], shortcut: 'Alt + /' },
];
