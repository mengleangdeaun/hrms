import { lazy } from 'react';

const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/login'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));
const LockScreen = lazy(() => import('../pages/Auth/LockScreen'));
const ProfileSetting = lazy(() => import('../pages/Profile/ProfileSetting'));
const UserPreferences = lazy(() => import('../pages/Profile/UserPreferences'));
const RoleManagement = lazy(() => import('../pages/AccessControl/Roles'));
const UserManagement = lazy(() => import('../pages/AccessControl/Users'));

// SaaS / Super Admin settings
const TemplateIndex = lazy(() => import('../pages/TemplateBuilder/Index'));
const TemplateBuilder = lazy(() => import('../pages/TemplateBuilder/TemplateBuilder'));
const DocumentTypes = lazy(() => import('../pages/TemplateBuilder/DocumentTypes'));
const BrandingIndex = lazy(() => import('../pages/Settings/Branding/Index'));
const PwaSettings = lazy(() => import('../pages/Settings/PwaSettings'));
const AppFeedbackIndex = lazy(() => import('../pages/Settings/AppFeedback/Index'));
const SystemLogsIndex = lazy(() => import('../pages/Settings/SystemLogs/Index'));

const Error = lazy(() => import('../components/Error'));

const superAdminRoutes = [
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
    // Template Builder & Branding
    { 
        path: '/settings/templates', 
        element: <TemplateIndex />, 
        layout: 'default', 
        permission: 'view_settings' 
    },
    { 
        path: '/settings/templates/:id/edit', 
        element: <TemplateBuilder />, 
        layout: 'default', 
        permission: 'view_settings' 
    },
    { 
        path: '/settings/document-types', 
        element: <DocumentTypes />, 
        layout: 'default', 
        permission: 'view_settings' 
    },
    { 
        path: '/settings/branding', 
        element: <BrandingIndex />, 
        layout: 'default', 
        permission: 'view_settings' 
    },
    { 
        path: '/settings/pwa-settings', 
        element: <PwaSettings />, 
        layout: 'default', 
        permission: 'manage_pwa_settings' 
    },
    { 
        path: '/settings/pwa-feedbacks', 
        element: <AppFeedbackIndex />, 
        layout: 'default', 
        permission: 'view_settings' 
    },
    { 
        path: '/settings/system-logs', 
        element: <SystemLogsIndex />, 
        layout: 'default', 
        permission: 'view_settings' 
    },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { superAdminRoutes };
