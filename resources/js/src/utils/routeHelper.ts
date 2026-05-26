
/**
 * Checks if the current path belongs to the Employee Mobile App (PWA) context.
 * These routes use employee_auth_token instead of the standard admin session.
 */
export const isEmployeeAppRoute = (pathname: string): boolean => {
    // Matches employee or attendance/scan as a whole path segment
    // Supports subdirectories (e.g., /s_cool_crm/public/employee/...)
    // This regex matches "employee" or "attendance/scan"
    // that is preceded by start of string or a slash, and followed by end of string or a slash.
    return /(^|\/)(employee|attendance\/scan)($|\/)/.test(pathname);
};

/**
 * Checks if the current path belongs to the Telegram Mini App (TMA).
 */
export const isTmaRoute = (pathname: string): boolean => {
    return pathname.startsWith('/tma/');
};

/**
 * Checks if the current path belongs to the Admin Attendance features.
 * These are NOT part of the PWA and should be treated as regular admin routes.
 */
export const isAdminAttendanceRoute = (pathname: string): boolean => {
    const adminPrefixes = [
        '/attendance/working-shifts',
        '/attendance/attendance-policies',
        '/attendance/records',
        '/attendance/employee-config',
        '/attendance/branch-qr'
    ];
    
    return adminPrefixes.some(prefix => pathname.startsWith(prefix));
};
