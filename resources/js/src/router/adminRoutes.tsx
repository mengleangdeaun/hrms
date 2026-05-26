import { lazy } from 'react';

const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/login'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));
const LockScreen = lazy(() => import('../pages/Auth/LockScreen'));
const ProfileSetting = lazy(() => import('../pages/Profile/ProfileSetting'));
const UserPreferences = lazy(() => import('../pages/Profile/UserPreferences'));

// Access Control
const RoleManagement = lazy(() => import('../pages/AccessControl/Roles'));
const UserManagement = lazy(() => import('../pages/AccessControl/Users'));

// HR & Organization
const BranchIndex = lazy(() => import('../pages/HR/Branch/Index'));
const DepartmentIndex = lazy(() => import('../pages/HR/Department/Index'));
const DesignationIndex = lazy(() => import('../pages/HR/Designation/Index'));
const DocumentTypeIndex = lazy(() => import('../pages/HR/DocumentType/Index'));

// Attendance
const WorkingShiftIndex = lazy(() => import('../pages/Attendance/WorkingShift/Index'));
const AttendancePolicyIndex = lazy(() => import('../pages/Attendance/AttendancePolicy/Index'));
const AttendanceRecordIndex = lazy(() => import('../pages/Attendance/AttendanceRecord/Index'));
const EmployeeConfigIndex = lazy(() => import('../pages/Attendance/EmployeeConfig/Index'));
const BranchQrSetup = lazy(() => import('../pages/Attendance/BranchQr/Index'));
const ReasonPresetIndex = lazy(() => import('../pages/Attendance/ReasonPreset/Index'));

// Alerts & Communications
const AnnouncementIndex = lazy(() => import('../pages/HR/Announcement/Index'));
const AnnouncementForm = lazy(() => import('../pages/HR/Announcement/Form'));
const TelegramSettings = lazy(() => import('../pages/Settings/Telegram/TelegramSettings'));

// Employee Administration
const EmployeeIndex = lazy(() => import('../pages/HR/Employee/Index'));
const EmployeeCreate = lazy(() => import('../pages/HR/Employee/Create'));
const EmployeeEdit = lazy(() => import('../pages/HR/Employee/Edit'));
const BranchEmployeeIndex = lazy(() => import('../pages/HR/BranchEmployees/Index'));

// HR Lifecycle
const AwardTypeIndex = lazy(() => import('../pages/HR/AwardType/Index'));
const AwardIndex = lazy(() => import('../pages/HR/Award/Index'));
const PromotionIndex = lazy(() => import('../pages/HR/Promotion/Index'));
const ResignationIndex = lazy(() => import('../pages/HR/Resignation/Index'));
const TerminationIndex = lazy(() => import('../pages/HR/Termination/Index'));
const WarningIndex = lazy(() => import('../pages/HR/Warning/Index'));
const SalaryMovementIndex = lazy(() => import('../pages/HR/SalaryMovement/Index'));
const HolidayIndex = lazy(() => import('../pages/HR/Holiday/Index'));

// Reports
const AttendanceReportIndex = lazy(() => import('../pages/Report/Attendance/Index'));
const ActionOverviewIndex = lazy(() => import('../pages/Report/Action/Overview'));
const ActionReportIndex = lazy(() => import('../pages/Report/Action/Index'));

// Leave Management
const LeaveTypeIndex = lazy(() => import('../pages/HR/LeaveType/Index'));
const LeavePolicyIndex = lazy(() => import('../pages/HR/LeavePolicy/Index'));
const LeaveAllocationIndex = lazy(() => import('../pages/HR/LeaveAllocation/Index'));
const LeaveRecordIndex = lazy(() => import('../pages/HR/LeaveRecord/Index'));
const LeaveBalanceIndex = lazy(() => import('../pages/HR/LeaveBalance/Index'));
const DayOffIndex = lazy(() => import('../pages/HR/DayOff/Index'));

// Activity Logs & Feedbacks
const HrActivityIndex = lazy(() => import('../pages/HR/Activity/Index'));
const CompanyFeedbackIndex = lazy(() => import('../pages/HR/CompanyFeedback/Index'));
const MediaLibrary = lazy(() => import('../pages/Apps/MediaLibrary'));

// Support
const DocumentationIndex = lazy(() => import('../pages/Support/Documentation/Index'));
const ShortcutsIndex = lazy(() => import('../pages/Support/Shortcuts/Index'));

const Error = lazy(() => import('../components/Error'));

const adminRoutes = [
    {
        path: '/',
        element: <Index />,
        layout: 'blank',
    },
    // auth
    {
        path: '/auth/login',
        element: <Login />,
        layout: 'blank',
    },
    {
        path: '/auth/forgot-password',
        element: <ForgotPassword />,
        layout: 'blank',
    },
    {
        path: '/auth/reset-password',
        element: <ResetPassword />,
        layout: 'blank',
    },
    {
        path: '/auth/lockscreen',
        element: <LockScreen />,
        layout: 'blank',
    },
    // profile & preferences
    {
        path: '/users/profile',
        element: <ProfileSetting />,
        layout: 'default',
    },
    {
        path: '/users/preferences',
        element: <UserPreferences />,
        layout: 'default',
    },
    // Access Control
    {
        path: '/access-control/roles',
        element: <RoleManagement />,
        layout: 'default',
        permission: 'view_roles',
    },
    {
        path: '/access-control/users',
        element: <UserManagement />,
        layout: 'default',
        permission: 'view_users',
    },
    // HR & Organization
    {
        path: '/hr/branches',
        element: <BranchIndex />,
        layout: 'default',
        permission: 'manage_branches',
    },
    {
        path: '/hr/departments',
        element: <DepartmentIndex />,
        layout: 'default',
        permission: 'manage_departments',
    },
    {
        path: '/hr/designations',
        element: <DesignationIndex />,
        layout: 'default',
        permission: 'manage_designations',
    },
    {
        path: '/hr/document-types',
        element: <DocumentTypeIndex />,
        layout: 'default',
        permission: 'manage_document_types',
    },
    // Working Shifts & Policies
    {
        path: '/attendance/working-shifts',
        element: <WorkingShiftIndex />,
        layout: 'default',
        permission: 'view_attendance',
    },
    {
        path: '/attendance/attendance-policies',
        element: <AttendancePolicyIndex />,
        layout: 'default',
        permission: 'view_attendance',
    },
    {
        path: '/attendance/records',
        element: <AttendanceRecordIndex />,
        layout: 'default',
        permission: 'manage_attendance_records',
    },
    {
        path: '/attendance/employee-config',
        element: <EmployeeConfigIndex />,
        layout: 'default',
        permission: 'view_attendance',
    },
    {
        path: '/attendance/branch-qr',
        element: <BranchQrSetup />,
        layout: 'default',
        permission: 'view_attendance',
    },
    {
        path: '/attendance/reason-presets',
        element: <ReasonPresetIndex />,
        layout: 'default',
        permission: 'manage_attendance_policies',
    },
    // Announcements & Telegram
    {
        path: '/hr/announcements',
        element: <AnnouncementIndex />,
        layout: 'default',
        permission: 'manage_announcements',
    },
    {
        path: '/hr/announcements/create',
        element: <AnnouncementForm />,
        layout: 'default',
        permission: 'manage_announcements',
    },
    {
        path: '/hr/announcements/:id/edit',
        element: <AnnouncementForm />,
        layout: 'default',
        permission: 'manage_announcements',
    },
    {
        path: '/settings/telegram-settings',
        element: <TelegramSettings />,
        layout: 'default',
        permission: 'view_settings',
    },
    // Employees
    {
        path: '/hr/employees',
        element: <EmployeeIndex />,
        layout: 'default',
        permission: 'view_employees',
    },
    {
        path: '/hr/employees/create',
        element: <EmployeeCreate />,
        layout: 'default',
        permission: 'create_employees',
    },
    {
        path: '/hr/employees/:id/edit',
        element: <EmployeeEdit />,
        layout: 'default',
        permission: 'edit_employees',
    },
    {
        path: '/hr/branch-employees',
        element: <BranchEmployeeIndex />,
        layout: 'default',
        permission: 'manage_branch_employees',
    },
    // Awards & Lifecycle
    {
        path: '/hr/award-types',
        element: <AwardTypeIndex />,
        layout: 'default',
        permission: 'manage_award_types',
    },
    {
        path: '/hr/awards',
        element: <AwardIndex />,
        layout: 'default',
        permission: 'manage_awards',
    },
    {
        path: '/hr/promotions',
        element: <PromotionIndex />,
        layout: 'default',
        permission: 'manage_promotions',
    },
    {
        path: '/hr/resignations',
        element: <ResignationIndex />,
        layout: 'default',
        permission: 'manage_resignations',
    },
    {
        path: '/hr/terminations',
        element: <TerminationIndex />,
        layout: 'default',
        permission: 'manage_terminations',
    },
    {
        path: '/hr/warnings',
        element: <WarningIndex />,
        layout: 'default',
        permission: 'manage_warnings',
    },
    {
        path: '/hr/salary-movements',
        element: <SalaryMovementIndex />,
        layout: 'default',
        permission: 'manage_salary_movements',
    },
    {
        path: '/hr/holidays',
        element: <HolidayIndex />,
        layout: 'default',
        permission: 'manage_holidays',
    },
    // Reports
    {
        path: '/report/attendance',
        element: <AttendanceReportIndex />,
        layout: 'default',
        permission: 'view_attendance_report',
    },
    {
        path: '/report/action-overview',
        element: <ActionOverviewIndex />,
        layout: 'default',
        permission: 'view_attendance_report',
    },
    {
        path: '/report/action',
        element: <ActionReportIndex />,
        layout: 'default',
        permission: 'view_attendance_report',
    },
    // Leave Management
    {
        path: '/hr/leave-types',
        element: <LeaveTypeIndex />,
        layout: 'default',
        permission: 'manage_leave_types',
    },
    {
        path: '/hr/leave-policies',
        element: <LeavePolicyIndex />,
        layout: 'default',
        permission: 'manage_leave_policies',
    },
    {
        path: '/hr/leave-allocations',
        element: <LeaveAllocationIndex />,
        layout: 'default',
        permission: 'manage_leave_allocations',
    },
    {
        path: '/hr/leave-records',
        element: <LeaveRecordIndex />,
        layout: 'default',
        permission: 'manage_leave_records',
    },
    {
        path: '/hr/leave-balances',
        element: <LeaveBalanceIndex />,
        layout: 'default',
        permission: 'view_leave_balances',
    },
    {
        path: '/hr/day-offs',
        element: <DayOffIndex />,
        layout: 'default',
        permission: 'manage_day_offs',
    },
    // Activity & Feedbacks
    {
        path: '/hr/activities',
        element: <HrActivityIndex />,
        layout: 'default',
        permission: 'view_hr_activity_log',
    },
    {
        path: '/hr/company-feedbacks',
        element: <CompanyFeedbackIndex />,
        layout: 'default',
        permission: 'manage_company_feedbacks',
    },
    {
        path: '/apps/media-library',
        element: <MediaLibrary />,
        layout: 'default',
        permission: 'access_media_library',
    },
    // Support
    { path: '/support/documentation', element: <DocumentationIndex />, layout: 'default' },
    { path: '/support/shortcuts', element: <ShortcutsIndex />, layout: 'default' },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { adminRoutes };
