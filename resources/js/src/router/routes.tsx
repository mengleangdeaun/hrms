import { lazy } from 'react';

// Core PWA Components (Eagerly imported for offline reliability)
import EmployeePwaError from '../pages/EmployeeApp/Error';
import EmployeePwaActivity from '../pages/EmployeeApp/Activity/Index';
import EmployeePwaActivityCreate from '../pages/EmployeeApp/Activity/Create';
import MobileEmployeeLogin from '../pages/EmployeeApp/Login/Index';
import MobileEmployeeScan from '../pages/EmployeeApp/Scan/Index';
import EmployeePwaScan from '../pages/EmployeeApp/Scanlogin/Index';
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/login'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));
const LockScreen = lazy(() => import('../pages/Auth/LockScreen'));
const ProfileSetting = lazy(() => import('../pages/Profile/ProfileSetting'));
const BranchIndex = lazy(() => import('../pages/HR/Branch/Index'));
const DepartmentIndex = lazy(() => import('../pages/HR/Department/Index'));
const DocumentTypeIndex = lazy(() => import('../pages/HR/DocumentType/Index'));
const DesignationIndex = lazy(() => import('../pages/HR/Designation/Index'));
const WorkingShiftIndex = lazy(() => import('../pages/Attendance/WorkingShift/Index'));
const AttendancePolicyIndex = lazy(() => import('../pages/Attendance/AttendancePolicy/Index'));
const AttendanceRecordIndex = lazy(() => import('../pages/Attendance/AttendanceRecord/Index'));
const EmployeeIndex = lazy(() => import('../pages/HR/Employee/Index'));
const EmployeeCreate = lazy(() => import('../pages/HR/Employee/Create'));
const EmployeeEdit = lazy(() => import('../pages/HR/Employee/Edit'));
const BranchEmployeeIndex = lazy(() => import('../pages/HR/BranchEmployees/Index'));
const EmployeeConfigIndex = lazy(() => import('../pages/Attendance/EmployeeConfig/Index'));
const AwardTypeIndex = lazy(() => import('../pages/HR/AwardType/Index'));
const AwardIndex = lazy(() => import('../pages/HR/Award/Index'));
const PromotionIndex = lazy(() => import('../pages/HR/Promotion/Index'));
const ResignationIndex = lazy(() => import('../pages/HR/Resignation/Index'));
const TerminationIndex = lazy(() => import('../pages/HR/Termination/Index'));
const WarningIndex = lazy(() => import('../pages/HR/Warning/Index'));
const HolidayIndex = lazy(() => import('../pages/HR/Holiday/Index'));
const AttendanceReportIndex = lazy(() => import('../pages/Report/Attendance/Index'));
const ActionOverviewIndex = lazy(() => import('../pages/Report/Action/Overview'));
const ActionReportIndex = lazy(() => import('../pages/Report/Action/Index'));
const SalaryMovementIndex = lazy(() => import('../pages/HR/SalaryMovement/Index'));
const ReasonPresetIndex = lazy(() => import('../pages/Attendance/ReasonPreset/Index'));


// Leave Management
const CompanyFeedbackIndex = lazy(() => import('../pages/HR/CompanyFeedback/Index'));
const LeaveTypeIndex = lazy(() => import('../pages/HR/LeaveType/Index'));
const LeavePolicyIndex = lazy(() => import('../pages/HR/LeavePolicy/Index'));
const LeaveAllocationIndex = lazy(() => import('../pages/HR/LeaveAllocation/Index'));
const LeaveRecordIndex = lazy(() => import('../pages/HR/LeaveRecord/Index'));
const LeaveBalanceIndex = lazy(() => import('../pages/HR/LeaveBalance/Index'));
const DayOffIndex = lazy(() => import('../pages/HR/DayOff/Index'));

// Announcements & Telegram
const AnnouncementIndex = lazy(() => import('../pages/HR/Announcement/Index'));
const AnnouncementForm = lazy(() => import('../pages/HR/Announcement/Form'));
const TelegramSettings = lazy(() => import('../pages/Settings/Telegram/TelegramSettings'));
const SystemLogsIndex = lazy(() => import('../pages/Settings/SystemLogs/Index'));

const AppFeedbackIndex = lazy(() => import('../pages/Settings/AppFeedback/Index'));


const UserPreferences = lazy(() => import('../pages/Profile/UserPreferences'));

const MediaLibrary = lazy(() => import('../pages/Apps/MediaLibrary'));
const Error = lazy(() => import('../components/Error'));

const BranchQrSetup = lazy(() => import('../pages/Attendance/BranchQr/Index'));

const EmployeePwaDashboard = lazy(() => import('../pages/EmployeeApp/Dashboard/Index'));
const EmployeePwaCalendar = lazy(() => import('../pages/EmployeeApp/Calendar/Index'));
const EmployeePwaProfile = lazy(() => import('../pages/EmployeeApp/Profile/Index'));
const EmployeePwaLeave = lazy(() => import('../pages/EmployeeApp/Leave/Index'));
const EmployeePwaLeaveCreate = lazy(() => import('../pages/EmployeeApp/Leave/Create'));
const EmployeePwaFeedbackCreate = lazy(() => import('../pages/EmployeeApp/Feedback/Create'));
const EmployeePwaHistory = lazy(() => import('../pages/EmployeeApp/History/Index'));
const EmployeePwaSettings = lazy(() => import('../pages/EmployeeApp/Settings/Index'));
const EmployeePwaNotifications = lazy(() => import('../pages/EmployeeApp/Notification/Index'));
const EmployeePwaAnnouncementDetail = lazy(() => import('../pages/EmployeeApp/Notification/AnnouncementDetail'));
const EmployeePwaCelebrationWish = lazy(() => import('../pages/EmployeeApp/Celebration/WishPage'));
const EmployeePwaWishesInbox = lazy(() => import('../pages/EmployeeApp/Celebration/WishesInbox'));
const EmployeePwaDayOff = lazy(() => import('../pages/EmployeeApp/DayOff/Index'));
const PwaSettings = lazy(() => import('../pages/Settings/PwaSettings'));

// Public Pages


// HR - Activity Log
const HrActivityIndex = lazy(() => import('../pages/HR/Activity/Index'));


// Access Control
const RoleManagement = lazy(() => import('../pages/AccessControl/Roles'));
const UserManagement = lazy(() => import('../pages/AccessControl/Users'));

// Template builder
const TemplateIndex = lazy(() => import('../pages/TemplateBuilder/Index'));
const TemplateBuilder = lazy(() => import('../pages/TemplateBuilder/TemplateBuilder'));
const DocumentTypes = lazy(() => import('../pages/TemplateBuilder/DocumentTypes'));
const BrandingIndex = lazy(() => import('../pages/Settings/Branding/Index'));
const DocumentationIndex = lazy(() => import('../pages/Support/Documentation/Index'));
const ShortcutsIndex = lazy(() => import('../pages/Support/Shortcuts/Index'));


const routes = [
    // dashboard
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
    // profile
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
    // Branch (Single Page with Modal)
    {
        path: '/hr/branches',
        element: <BranchIndex />,
        layout: 'default',
        permission: 'manage_branches',
    },
    // Departments
    {
        path: '/hr/departments',
        element: <DepartmentIndex />,
        layout: 'default',
        permission: 'manage_departments',
    },
    // Designations
    {
        path: '/hr/designations',
        element: <DesignationIndex />,
        layout: 'default',
        permission: 'manage_designations',
    },
    // Document Types
    {
        path: '/hr/document-types',
        element: <DocumentTypeIndex />,
        layout: 'default',
        permission: 'manage_document_types',
    },
    // Working Shifts
    {
        path: '/attendance/working-shifts',
        element: <WorkingShiftIndex />,
        layout: 'default',
        permission: 'view_attendance',
    },
    // Attendance Policies
    {
        path: '/attendance/attendance-policies',
        element: <AttendancePolicyIndex />,
        layout: 'default',
        permission: 'view_attendance',
    },
    // Attendance Records
    {
        path: '/attendance/records',
        element: <AttendanceRecordIndex />,
        layout: 'default',
        permission: 'manage_attendance_records',
    },
    // Employee Config
    {
        path: '/attendance/employee-config',
        element: <EmployeeConfigIndex />,
        layout: 'default',
        permission: 'view_attendance',
    },
    // Branch QR Setup
    {
        path: '/attendance/branch-qr',
        element: <BranchQrSetup />,
        layout: 'default',
        permission: 'view_attendance',
    },
    // Reason Presets
    {
        path: '/attendance/reason-presets',
        element: <ReasonPresetIndex />,
        layout: 'default',
        permission: 'manage_attendance_policies',
    },
    // Mobile Employee Kiosk
    {
        path: '/employee/login',
        element: <MobileEmployeeLogin />,
        layout: 'blank', // no sidebar
    },
    {
        path: '/attendance/scan',
        element: <MobileEmployeeScan />,
        layout: 'blank', // no sidebar
    },
    // Employee PWA App Pages (uses BottomNav layout)
    {
        path: '/employee/dashboard',
        element: <EmployeePwaDashboard />,
        layout: 'mobile',
    },

    {
        path: '/employee/calendar',
        element: <EmployeePwaCalendar />,
        layout: 'mobile',
    },
    {
        path: '/employee/profile',
        element: <EmployeePwaProfile />,
        layout: 'mobile',
    },
    {
        path: '/employee/scan',
        element: <EmployeePwaScan />,
        layout: 'blank',
    },
    {
        path: '/employee/leave',
        element: <EmployeePwaLeave />,
        layout: 'mobile',
    },
    {
        path: '/employee/leave/create',
        element: <EmployeePwaLeaveCreate />,
        layout: 'mobile',
    },
    {
        path: '/employee/day-off',
        element: <EmployeePwaDayOff />,
        layout: 'mobile',
    },
    {
        path: '/employee/history',
        element: <EmployeePwaHistory />,
        layout: 'mobile',
    },
    {
        path: '/employee/settings',
        element: <EmployeePwaSettings />,
        layout: 'mobile',
    },
    {
        path: '/employee/notifications',
        element: <EmployeePwaNotifications />,
        layout: 'mobile',
    },
    {
        path: '/employee/announcements/:id',
        element: <EmployeePwaAnnouncementDetail />,
        layout: 'mobile',
    },
    {
        path: '/employee/celebrations/:id',
        element: <EmployeePwaCelebrationWish />,
        layout: 'mobile',
    },
    {
        path: '/employee/wishes',
        element: <EmployeePwaWishesInbox />,
        layout: 'mobile',
    },
    {
        path: '/employee/activity',
        element: <EmployeePwaActivity />,
        layout: 'mobile',
    },
    {
        path: '/employee/activity/create',
        element: <EmployeePwaActivityCreate />,
        layout: 'mobile',
    },
    {
        path: '/employee/feedback/create',
        element: <EmployeePwaFeedbackCreate />,
        layout: 'mobile',
    },
    {
        path: '/employee/*',
        element: <EmployeePwaError />,
        layout: 'blank',
    },
    // HR - Announcements
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

    {
        path: '/settings/system-logs',
        element: <SystemLogsIndex />,
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
    // Awards
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
    // Attendance Report
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
    // HR - Activity Log
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



    // Template Builder
    { path: '/settings/templates', element: <TemplateIndex />, layout: 'default', permission: 'view_settings' },
    { path: '/settings/templates/:id/edit', element: <TemplateBuilder />, layout: 'default', permission: 'view_settings' },
    { path: '/settings/document-types', element: <DocumentTypes />, layout: 'default', permission: 'view_settings' },
    { path: '/settings/branding', element: <BrandingIndex />, layout: 'default', permission: 'view_settings' },
    { path: '/settings/pwa-settings', element: <PwaSettings />, layout: 'default', permission: 'manage_pwa_settings' },
    { path: '/settings/pwa-feedbacks', element: <AppFeedbackIndex />, layout: 'default', permission: 'view_settings' },
    // Support
    { path: '/support/documentation', element: <DocumentationIndex />, layout: 'default' },
    { path: '/support/shortcuts', element: <ShortcutsIndex />, layout: 'default' },
    {
        path: '*',
        element: window.location.pathname.includes('/employee/') || window.location.pathname.includes('/attendance/') ? <EmployeePwaError /> : <Error />,
        layout: 'blank',
    },
];

export { routes };
