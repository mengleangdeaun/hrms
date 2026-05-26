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
    { title: 'super_dashboard', path: '/dashboard/super', category: 'dashboard', permission: 'view_sales', keywords: ['admin', 'stats', 'overview', 'ផ្ទាំងគ្រប់គ្រង'], shortcut: 'Alt + H' },
    { title: 'finance_dashboard', path: '/dashboard/finance', category: 'dashboard', permission: 'view_finance', keywords: ['money', 'stats', 'accounting', 'ហិរញ្ញវត្ថុ'] },
    { title: 'sales_dashboard', path: '/dashboard/sales', category: 'dashboard', permission: 'view_sales', keywords: ['revenue', 'pos', 'performance', 'ការលក់'], shortcut: 'Alt + Shift + D' },
    { title: 'lead_board', path: '/dashboard/leads', category: 'dashboard', permission: 'view_crm', keywords: ['crm', 'pipeline', 'opportunity', 'នាំមុខ'] },
    { title: 'attendance_dashboard', path: '/dashboard/attendance', category: 'dashboard', permission: 'view_attendance', keywords: ['hr', 'clock', 'time', 'វត្តមាន'] },
    { title: 'tech_performance_dashboard', path: '/dashboard/tech-performance', category: 'dashboard', permission: 'view_workshop', keywords: ['workshop', 'technician', 'efficiency', 'ជាង'] },
    { title: 'inventory_dashboard', path: '/dashboard/inventory', category: 'dashboard', permission: 'view_inventory', keywords: ['stock', 'warehouse', 'items', 'សារពើភ័ណ្ឌ', 'ស្តុក'] },

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

    // Inventory
    { title: 'branch_products', path: '/inventory/branch-products', category: 'inventory', permission: 'view_branch_products' },
    { title: 'branch_services', path: '/inventory/branch-services', category: 'inventory', permission: 'view_branch_services' },
    { title: 'register_roll', path: '/inventory/serials', category: 'inventory', permission: 'view_serials', keywords: ['stock', 'serial', 'rolls', 'កី','ចុះលេខកី'] },

    // Procurement
    { title: 'suppliers', path: '/procurement/suppliers', category: 'procurement', permission: 'manage_suppliers', keywords: ['vendor', 'purchase', 'sourcing'] },
    { title: 'purchase_orders', path: '/procurement/purchase-orders', category: 'procurement', permission: 'manage_purchase_orders', keywords: ['po', 'buy', 'orders', 'ទិញចូល'], shortcut: 'Alt + O' },
    { title: 'purchase_receives', path: '/procurement/purchase-receives', category: 'procurement', permission: 'manage_purchase_receives', keywords: ['grn', 'receive', 'delivery', 'ទទួលទំនិញ'], shortcut: 'Alt + I' },

    // Stock Management
    { title: 'reporting', path: '/stock/stock-balance', category: 'stock', permission: 'view_stock_balance', keywords: ['summary', 'total', 'report', 'ស្តុក'] },
    { title: 'stock_tracking', path: '/stock/stocks', category: 'stock', permission: 'view_stock_ledger', keywords: ['history', 'tracking', 'balance', 'ស្តុក'] },
    { title: 'stock_movements', path: '/stock/stock-movements', category: 'stock', permission: 'view_stock_movements', keywords: ['transfer', 'in-out', 'activity', 'ស្តុក'] },
    { title: 'serial_movements', path: '/stock/serial-movements', category: 'stock', permission: 'view_serial_movements', keywords: ['ស្តុក', 'កី', 'Serial' ] },
    { title: 'off_cut_serials', path: '/stock/off-cut-serials', category: 'stock', permission: 'view_off_cut_serials', keywords: ['ស្តុក', 'កី', 'Serial', 'ស្តុកសល់', 'ស្តុកស្រាប់'] },
    { title: 'stock_adjustments', path: '/stock/adjustments', category: 'stock', permission: 'manage_stock_adjustments', keywords: ['correction', 'edit', 'balance', 'ស្តុក'] },
    { title: 'stock_transfers', path: '/stock/transfers', category: 'stock', permission: 'manage_stock_transfers', keywords: ['move', 'warehouse', 'branch', 'ស្តុក'] },

    // Sales
    { title: 'create_sale_pos', path: '/sales/create', category: 'sales', permission: 'access_pos', keywords: ['sell', 'cashier', 'terminal', 'លក់', 'POS' ], shortcut: 'Alt + S' },
    { title: 'sales_orders', path: '/sales/orders', category: 'sales', permission: 'view_sales_orders', keywords: ['orders', 'history', 'transactions', 'បញ្ជីលក់'], shortcut: 'Alt + Shift + S' },
    { title: 'sales_invoices', path: '/sales/invoices', category: 'sales', permission: 'view_sales_invoices', keywords: ['bill', 'payment', 'tax', 'វិក្កយបត្រ'], shortcut: 'Alt + V' },
    { title: 'quotation', path: '/sales/quotation', category: 'sales', permission: 'view_quotations', keywords: ['estimate', 'proposal', 'price', 'សម្រង់តម្លៃ'], shortcut: 'Alt + Shift + Q' },

    // CRM
    { title: 'lead_list', path: '/crm/leads/list', category: 'crm', permission: 'manage_leads', keywords: ['prospect', 'sales', 'pipeline', 'នាំមុខ', 'តម្រុយ'], shortcut: 'Alt + L' },
    { title: 'contacts', path: '/crm/contacts', category: 'crm', permission: 'manage_contacts', keywords: ['phone', 'email', 'address', 'ទំនាក់ទំនង'] },
    { title: 'customers', path: '/crm/customers', category: 'crm', permission: 'view_customers', keywords: ['client', 'accounts', 'profiles', 'អតិថិជន', 'ភ្ញៀវ'] },
    { title: 'customer_vehicles', path: '/crm/customer-vehicles', category: 'crm', permission: 'manage_customer_vehicles', keywords: ['car', 'service', 'license', 'ឡាន'] },
    { title: 'service_bookings', path: '/crm/tma/bookings', category: 'crm', permission: 'view_service_bookings', keywords: ['appointment', 'workshop', 'schedule', 'កក់'] },
    { title: 'customer_feedback', path: '/crm/customer-feedback', category: 'crm', permission: 'view_customer_feedback', keywords: ['opinion', 'survey', 'complaint', 'មតិ'] },
    { title: 'customer_ratings', path: '/crm/customer-ratings', category: 'crm', permission: 'view_customer_ratings', keywords: ['stars', 'performance', 'score', 'វាយតម្លៃ', 'Rate'] },

    // Marketing & Recall
    { title: 'tma_banners', path: '/crm/banners', category: 'marketing', permission: 'manage_tma_banners', keywords: ['ads', 'promotion', 'mobile'] },
    { title: 'create_new_broadcast', path: '/crm/tma/broadcast/new', category: 'marketing', permission: 'manage_tma_broadcast', keywords: ['telegram', 'push', 'news'] },
    { title: 'broadcast_history', path: '/crm/tma/broadcast/history', category: 'marketing', permission: 'manage_tma_broadcast', keywords: ['logs', 'performance', 'stats'] },

    // Finance
    { title: 'payment_accounts', path: '/finance/payment-accounts', category: 'finance', permission: 'manage_payment_accounts', keywords: ['bank', 'cash', 'account'], shortcut: 'Alt + Shift + F' },
    { title: 'expenses', path: '/finance/expenses', category: 'finance', permission: 'manage_expenses', keywords: ['costs', 'payout', 'spend'], shortcut: 'Alt + X' },
    { title: 'incomes', path: '/finance/incomes', category: 'finance', permission: 'manage_incomes', keywords: ['revenue', 'earnings', 'profit'], shortcut: 'Alt + N' },
    { title: 'transactions', path: '/finance/transactions', category: 'finance', permission: 'view_transactions', keywords: ['ledger', 'history', 'activity'], shortcut: 'Alt + F' },
    { title: 'finance_categories', path: '/finance/categories', category: 'finance', permission: 'manage_finance_categories' },

    // Job Control
    { title: 'job_cards', path: '/services/job-cards', category: 'workshops', permission: 'view_workshop', keywords: ['service', 'repair', 'task', 'ការងារជាង'], shortcut: 'Alt + J' },
    { title: 'qc_report', path: '/services/qc-reports', category: 'workshops', permission: 'view_workshop', keywords: ['quality', 'inspection', 'audit', 'ការត្រួតពិនិត្យ', 'QC'], shortcut: 'Alt + C' },
    { title: 'damage_report', path: '/services/damage-reports', category: 'workshops', permission: 'view_damage_reports', keywords: ['failure', 'rework', 'broken', 'ការខូចខាត'] },

    // Setup & Settings
    { title: 'customer_type_setup', path: '/crm/customer-types', category: 'setup_data', permission: 'manage_customer_types' },
    { title: 'pipeline_stage_setup', path: '/crm/settings', category: 'setup_data', permission: 'manage_crm_settings' },
    { title: 'tma_setting', path: '/crm/tma/settings', category: 'setup_data', permission: 'manage_tma_settings' },
    { title: 'sale_remarks', path: '/sales/remarks', category: 'setup_data', permission: 'manage_sale_remarks' },
    { title: 'inventory_categories', path: '/inventory/categories', category: 'setup_data', permission: 'manage_inventory_categories' },
    { title: 'uom_setup', path: '/inventory/uoms', category: 'setup_data', permission: 'manage_uoms' },
    { title: 'tag_setup', path: '/inventory/tags', category: 'setup_data', permission: 'manage_tags' },
    { title: 'product_setup', path: '/inventory/products', category: 'setup_data', permission: 'manage_products' },
    { title: 'service_packages', path: '/service/list', category: 'setup_data', permission: 'manage_products' },
    { title: 'warehouse_setup', path: '/inventory/locations', category: 'setup_data', permission: 'manage_locations' },
    { title: 'installation_part', path: '/services/parts', category: 'setup_data', permission: 'manage_service_parts' },
    { title: 'vehicle_brands', path: '/services/vehicles/brands', category: 'setup_data', permission: 'manage_vehicle_brands' },
    { title: 'vehicle_models', path: '/services/vehicles/models', category: 'setup_data', permission: 'manage_vehicle_models' },
    { title: 'damage_type_setup', path: '/services/damage-types', category: 'setup_data', permission: 'manage_damage_types' },
    { title: 'document_numbers', path: '/settings/document-numbers', category: 'settings', permission: 'manage_setup_data' },
    { title: 'template_builder', path: '/settings/templates', category: 'settings', permission: 'manage_templates' },
    { title: 'form_document_types', path: '/settings/document-types', category: 'settings', permission: 'manage_templates' },
    { title: 'branding', path: '/settings/branding', category: 'settings', permission: 'manage_branding' },
    { title: 'exchange_rate', path: '/settings/exchange-rate', category: 'settings', permission: 'manage_setup_data' },
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
