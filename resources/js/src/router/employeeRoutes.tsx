import { lazy } from 'react';

// Core PWA Components (Eagerly imported for offline reliability)
import EmployeePwaError from '../pages/EmployeeApp/Error';
import EmployeePwaActivity from '../pages/EmployeeApp/Activity/Index';
import EmployeePwaActivityCreate from '../pages/EmployeeApp/Activity/Create';
import MobileEmployeeLogin from '../pages/EmployeeApp/Login/Index';
import MobileEmployeeScan from '../pages/EmployeeApp/Scan/Index';
import EmployeePwaScan from '../pages/EmployeeApp/Scanlogin/Index';

const Index = lazy(() => import('../pages/Index'));
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

const employeeRoutes = [
    {
        path: '/',
        element: <Index />,
        layout: 'blank',
    },
    // Mobile Employee Kiosk
    {
        path: '/employee/login',
        element: <MobileEmployeeLogin />,
        layout: 'blank',
    },
    {
        path: '/attendance/scan',
        element: <MobileEmployeeScan />,
        layout: 'blank',
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
    {
        path: '*',
        element: <EmployeePwaError />,
        layout: 'blank',
    },
];

export { employeeRoutes };
