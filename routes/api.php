<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Inventory\PurchaseReceiveController;
use Spatie\Health\Facades\Health;
use App\Http\Controllers\SystemHealthController;

Route::get('health', SystemHealthController::class);
Route::post('health/check', [SystemHealthController::class, 'runCheck']);

// Cleaned non-HR routes



/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('login', [App\Http\Controllers\Auth\LoginController::class, 'login']);
Route::post('login/verify-2fa', [App\Http\Controllers\Auth\LoginController::class, 'verify2FA']);
Route::post('login-telegram', [App\Http\Controllers\Auth\LoginController::class, 'loginWithTelegram']);
Route::get('telegram-bot-name', [App\Http\Controllers\Auth\LoginController::class, 'getTelegramBotName']);
Route::post('forgot-password', [App\Http\Controllers\Auth\PasswordResetController::class, 'sendResetLinkEmail']);
Route::post('reset-password', [App\Http\Controllers\Auth\PasswordResetController::class, 'reset']);

Route::middleware([\App\Http\Middleware\Authenticate::class.':sanctum'])->group(function () {
    Route::get('user', function (Request $request) {
        return new \App\Http\Resources\Auth\UserResource($request->user()->load(['roles', 'employee', 'roles.permissions', 'branches']));
    });

    Route::post('/profile/update', [App\Http\Controllers\ProfileController::class, 'update']);
    Route::post('/profile/password', [App\Http\Controllers\ProfileController::class, 'updatePassword']);
    Route::post('/profile/email', [App\Http\Controllers\ProfileController::class, 'updateEmail']);
    Route::post('/user/preferences', [App\Http\Controllers\ProfileController::class, 'updatePreferences']);
    Route::post('/profile/link-telegram', [App\Http\Controllers\ProfileController::class, 'linkTelegram']);

    Route::post('/email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return response()->json(['message' => 'Verification link sent!']);
    })->middleware([\Illuminate\Routing\Middleware\ThrottleRequests::class.':6,1'])->name('verification.send');
    // Push Subscriptions
    Route::post('push-subscriptions', [App\Http\Controllers\PushSubscriptionController::class, 'update']);
    Route::delete('push-subscriptions', [App\Http\Controllers\PushSubscriptionController::class, 'destroy']);

    Route::prefix('hr')->group(function () {
        Route::apiResource('branches', App\Http\Controllers\HR\BranchController::class);
        Route::post('branches/{id}/link-location', [App\Http\Controllers\HR\BranchController::class, 'linkLocation']);
        Route::apiResource('departments', App\Http\Controllers\HR\DepartmentController::class);
        Route::apiResource('designations', App\Http\Controllers\HR\DesignationController::class);
        Route::apiResource('document-types', App\Http\Controllers\HR\DocumentTypeController::class);
        Route::get('employees/export', [App\Http\Controllers\HR\EmployeeController::class, 'export']);
        Route::post('employees/import', [App\Http\Controllers\HR\EmployeeController::class, 'import']);
        Route::post('employees/import-chunk', [App\Http\Controllers\HR\EmployeeController::class, 'importChunk']);
        Route::apiResource('employees', App\Http\Controllers\HR\EmployeeController::class);
        Route::get('technicians', [App\Http\Controllers\HR\StaffSelectionController::class, 'technicians']);
        Route::get('qc-persons', [App\Http\Controllers\HR\StaffSelectionController::class, 'qcPersons']);
        Route::post('employees/{employee}/documents', [App\Http\Controllers\HR\EmployeeController::class, 'uploadDocument']);
        Route::delete('employees/{employee}/documents/{document}', [App\Http\Controllers\HR\EmployeeController::class, 'deleteDocument']);
        Route::apiResource('award-types', App\Http\Controllers\HR\AwardTypeController::class);
        Route::apiResource('awards', App\Http\Controllers\HR\AwardController::class);
        Route::apiResource('promotions', App\Http\Controllers\HR\PromotionController::class);
        Route::apiResource('resignations', App\Http\Controllers\HR\ResignationController::class);
        Route::apiResource('terminations', App\Http\Controllers\HR\TerminationController::class);
        Route::apiResource('warnings', App\Http\Controllers\HR\WarningController::class);
        Route::apiResource('holidays', App\Http\Controllers\HR\HolidayController::class);
        Route::apiResource('salary-movements', App\Http\Controllers\HR\SalaryMovementController::class);

        // Activity Log
        Route::get('activities/export', [App\Http\Controllers\HR\ActivityController::class, 'export']);
        Route::get('activities', [App\Http\Controllers\HR\ActivityController::class, 'index']);

        Route::get('activities/{activity}', [App\Http\Controllers\HR\ActivityController::class, 'show']);
        Route::put('activities/{activity}/status', [App\Http\Controllers\HR\ActivityController::class, 'updateStatus']);
        Route::delete('activities/{activity}', [App\Http\Controllers\HR\ActivityController::class, 'destroy']);

        // Action Report
        Route::get('action-report/overview', [App\Http\Controllers\HR\ActionReportController::class, 'overview']);
        Route::get('action-report/overview/export', [App\Http\Controllers\HR\ActionReportController::class, 'exportOverview']);
        Route::get('action-report', [App\Http\Controllers\HR\ActionReportController::class, 'index']);
        Route::get('action-report/export', [App\Http\Controllers\HR\ActionReportController::class, 'export']);

        Route::apiResource('company-feedbacks', App\Http\Controllers\HR\CompanyFeedbackController::class)->only(['index', 'destroy']);

        // Leave Management
        Route::apiResource('leave-types', App\Http\Controllers\HR\LeaveTypeController::class);
        Route::apiResource('leave-policies', App\Http\Controllers\HR\LeavePolicyController::class);
        Route::apiResource('leave-balances', App\Http\Controllers\HR\LeaveBalanceController::class);
        Route::apiResource('leave-allocations', App\Http\Controllers\HR\EmployeeLeaveAllocationController::class);

        Route::get('leave-requests/export', [App\Http\Controllers\HR\LeaveRequestController::class, 'export']);
        Route::apiResource('leave-requests', App\Http\Controllers\HR\LeaveRequestController::class)->except(['store', 'update']);
        Route::post('leave-requests/{id}/approve', [App\Http\Controllers\HR\LeaveRequestController::class, 'approve']);
        Route::post('leave-requests/{id}/reject', [App\Http\Controllers\HR\LeaveRequestController::class, 'reject']);

        // Day Off Management
        Route::apiResource('day-offs', App\Http\Controllers\HR\DayOffController::class);
        Route::get('day-off-requests', [App\Http\Controllers\HR\DayOffRequestController::class, 'index']);
        Route::post('day-off-requests/{id}/approve', [App\Http\Controllers\HR\DayOffRequestController::class, 'approve']);
        Route::post('day-off-requests/{id}/reject', [App\Http\Controllers\HR\DayOffRequestController::class, 'reject']);

        // Announcements
        Route::apiResource('announcements', App\Http\Controllers\HR\AnnouncementController::class);
        Route::get('announcements/{announcement}/statistics', [App\Http\Controllers\HR\AnnouncementController::class, 'statistics']);
        Route::get('announcements-form-data', [App\Http\Controllers\HR\AnnouncementController::class, 'formData']);

        // Branch Employee Management
        Route::get('branch-employees', [App\Http\Controllers\HR\BranchEmployeeController::class, 'index']);
        Route::put('branch-employees/{employee}', [App\Http\Controllers\HR\BranchEmployeeController::class, 'update']);
    });

    // Document Templates
    Route::apiResource('form-document-types', App\Http\Controllers\FormDocumentTypeController::class);
    // Form Template Builder
    Route::get('/templates', [App\Http\Controllers\FormTemplateController::class, 'index']);
    Route::get('/document-types/{slug}/templates', [App\Http\Controllers\FormTemplateController::class, 'index']);
    Route::get('/document-types/{slug}/active-template', [App\Http\Controllers\FormTemplateController::class, 'getActiveTemplate']);
    Route::post('/templates', [App\Http\Controllers\FormTemplateController::class, 'store']);
    Route::get('/templates/{id}', [App\Http\Controllers\FormTemplateController::class, 'show'])->whereNumber('id');
    Route::put('/templates/{id}', [App\Http\Controllers\FormTemplateController::class, 'update'])->whereNumber('id');
    Route::delete('/templates/{id}', [App\Http\Controllers\FormTemplateController::class, 'destroy'])->whereNumber('id');
    Route::post('/templates/{id}/clone', [App\Http\Controllers\FormTemplateController::class, 'clone'])->whereNumber('id');
    Route::put('/templates/{id}/activate', [App\Http\Controllers\FormTemplateController::class, 'activate'])->whereNumber('id');
    Route::put('/templates/{id}/reset', [App\Http\Controllers\FormTemplateController::class, 'reset'])->whereNumber('id');

    Route::prefix('attendance')->group(function () {
        Route::apiResource('working-shifts', App\Http\Controllers\Attendance\WorkingShiftController::class);
        Route::apiResource('attendance-policies', App\Http\Controllers\Attendance\AttendancePolicyController::class);
        Route::get('dashboard-stats', [App\Http\Controllers\Attendance\AttendanceDashboardController::class, 'index']);
        Route::get('dashboard-stat-drilldown', [App\Http\Controllers\Attendance\AttendanceDashboardController::class, 'getStatDrillDown']);
        Route::post('dashboard-send-notification', [App\Http\Controllers\Attendance\AttendanceDashboardController::class, 'sendNotification']);
        Route::get('report/summary', [App\Http\Controllers\Attendance\AttendanceReportController::class, 'summary']);
        Route::get('report/summary/export', [App\Http\Controllers\Attendance\AttendanceReportController::class, 'exportSummary']);
        Route::get('report/timeline/{employee}', [App\Http\Controllers\Attendance\AttendanceReportController::class, 'timeline']);
        Route::post('report/share', [App\Http\Controllers\Attendance\AttendanceReportController::class, 'shareReport']);
        Route::get('records/export', [App\Http\Controllers\Attendance\AttendanceRecordController::class, 'export']);
        Route::apiResource('records', App\Http\Controllers\Attendance\AttendanceRecordController::class)->only(['index', 'destroy']);

        Route::get('employee-config', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'index']);
        Route::put('employee-config/{employee}', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'updateField']);
        Route::get('branch-qr/{branch}', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'generateBranchQr']);
        Route::get('employee-qr/{employee}', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'generateEmployeeQr']);
        Route::post('device-unbind', [App\Http\Controllers\Attendance\EmployeeConfigController::class, 'unbindDevice']);

        Route::apiResource('reason-presets', App\Http\Controllers\Attendance\AttendanceReasonPresetController::class);
        Route::patch('reason-presets/{reasonPreset}/toggle-active', [App\Http\Controllers\Attendance\AttendanceReasonPresetController::class, 'toggleActive']);
    });

    Route::prefix('media')->group(function () {
        Route::get('folders', [App\Http\Controllers\MediaFolderController::class, 'index']);
        Route::post('folders', [App\Http\Controllers\MediaFolderController::class, 'store']);
        Route::put('folders/{folder}', [App\Http\Controllers\MediaFolderController::class, 'update']);
        Route::delete('folders/{folder}', [App\Http\Controllers\MediaFolderController::class, 'destroy']);

        Route::get('files', [App\Http\Controllers\MediaFileController::class, 'index']);
        Route::post('files/upload', [App\Http\Controllers\MediaFileController::class, 'upload']);
        Route::put('files/{file}', [App\Http\Controllers\MediaFileController::class, 'update']);
        Route::delete('files/{file}', [App\Http\Controllers\MediaFileController::class, 'destroy']);
        Route::put('files/{file}/favorite', [App\Http\Controllers\MediaFileController::class, 'favorite']);
        Route::get('storage-info', [App\Http\Controllers\MediaFileController::class, 'storageInfo']);
    });

    Route::prefix('settings')->group(function () {
        Route::get('storage', [App\Http\Controllers\StorageSettingController::class, 'index']);
        Route::put('storage/{provider}', [App\Http\Controllers\StorageSettingController::class, 'update']);
        Route::get('document-numbers', [App\Http\Controllers\Settings\DocumentSettingController::class, 'index']);
        Route::put('document-numbers/{id}', [App\Http\Controllers\Settings\DocumentSettingController::class, 'update']);
        Route::get('broadcast-settings', [App\Http\Controllers\Settings\TelegramBroadcastController::class, 'index']);
        Route::put('broadcast-settings/{id}', [App\Http\Controllers\Settings\TelegramBroadcastController::class, 'update']);
        Route::delete('broadcast-settings/{id}', [App\Http\Controllers\Settings\TelegramBroadcastController::class, 'destroy']);
        Route::post('broadcast-settings/{id}/test', [App\Http\Controllers\Settings\TelegramBroadcastController::class, 'test']);
        Route::get('system-logs', [App\Http\Controllers\Settings\SystemActivityLogController::class, 'index']);
        Route::delete('system-logs', [App\Http\Controllers\Settings\SystemActivityLogController::class, 'destroy']);

        // Telegram Configuration
        Route::get('telegram-settings', [App\Http\Controllers\Settings\TelegramSettingController::class, 'show']);
        Route::post('telegram-settings', [App\Http\Controllers\Settings\TelegramSettingController::class, 'save']);
        Route::post('telegram-settings/test', [App\Http\Controllers\Settings\TelegramSettingController::class, 'test']);

        // Branding Management
        Route::get('branding/global', [App\Http\Controllers\Settings\BrandingController::class, 'getGlobal']);
        Route::post('branding/global', [App\Http\Controllers\Settings\BrandingController::class, 'updateGlobal']);
        Route::get('branding/branches', [App\Http\Controllers\Settings\BrandingController::class, 'getBranches']);
        Route::put('branding/branches/{branch}', [App\Http\Controllers\Settings\BrandingController::class, 'updateBranch']);

        // PWA Settings
        Route::get('pwa-settings', [App\Http\Controllers\Settings\PwaSettingController::class, 'show']);
        Route::post('pwa-settings', [App\Http\Controllers\Settings\PwaSettingController::class, 'update']);
        Route::get('app-feedbacks', [App\Http\Controllers\Settings\AppFeedbackController::class, 'index']);
        Route::put('app-feedbacks/{id}/status', [App\Http\Controllers\Settings\AppFeedbackController::class, 'updateStatus']);
        Route::delete('app-feedbacks/{id}', [App\Http\Controllers\Settings\AppFeedbackController::class, 'destroy']);
    });

    // Access Control Routes
    Route::prefix('access-control')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\Auth\UserController::class);
        Route::apiResource('roles', \App\Http\Controllers\Auth\RoleController::class);
        Route::get('permissions', [\App\Http\Controllers\Auth\PermissionController::class, 'index']);
        Route::post('unlock', [\App\Http\Controllers\Auth\LockScreenController::class, 'unlock']);
    });

});

// Unified Notifications (Shared by Dashboard & PWA)
// Flexible Authentication (Handled manually in Controller to support both Web & Sanctum)
// Public/Employee Attendance Routes (Token-based)
Route::prefix('attendance')->group(function () {
    Route::post('employee-login', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'employeeLogin']);
    Route::post('login-credentials', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'loginWithCredentials']);
    Route::post('scan/clock', [App\Http\Controllers\Attendance\QrAttendanceController::class, 'scanClock']);
});



// Employee PWA Routes (Secured via custom auth.employee guard)
Route::prefix('employee-app')->middleware([\App\Http\Middleware\AuthenticateEmployeeByToken::class])->group(function () {
    // Identity & Settings
    Route::get('me', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'me']);
    Route::get('profile', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'profile']);
    Route::post('profile/avatar', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'updateAvatar']);
    Route::get('preferences', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'getPreferences']);
    Route::put('preferences', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'updatePreferences']);

    // Core Features
    Route::get('dashboard', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'dashboard']);
    Route::get('history', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'history']);
    Route::get('calendar-data', [App\Http\Controllers\EmployeeApp\EmployeeAppController::class, 'calendarData']);
    Route::get('activities', [App\Http\Controllers\EmployeeApp\ActivityController::class, 'index']);
    Route::post('activities', [App\Http\Controllers\EmployeeApp\ActivityController::class, 'store']);
    Route::post('feedback', [App\Http\Controllers\EmployeeApp\FeedbackController::class, 'store']);
    Route::post('app-feedback', [App\Http\Controllers\EmployeeApp\AppFeedbackController::class, 'store']);

    // Leave & Day Off
    Route::get('my-leave-balances', [App\Http\Controllers\EmployeeApp\LeaveController::class, 'myBalances']);
    Route::get('leave-requests', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'index']);
    Route::get('leave-requests/approvals', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'approvals']);
    Route::post('leave-requests', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'store']);
    Route::post('leave-requests/{id}/approve', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'approve']);
    Route::post('leave-requests/{id}/reject', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'reject']);
    Route::put('leave-requests/{id}/cancel', [App\Http\Controllers\EmployeeApp\LeaveRequestController::class, 'cancel']);

    Route::get('day-off', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'index']);
    Route::get('day-off/approvals', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'approvals']);
    Route::get('day-off-requests', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'myRequests']);
    Route::post('day-off-requests', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'store']);
    Route::post('day-off-requests/{id}/approve', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'approve']);
    Route::post('day-off-requests/{id}/reject', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'reject']);
    Route::put('day-off-requests/{id}/cancel', [App\Http\Controllers\EmployeeApp\DayOffController::class, 'cancel']);

    // Announcements & Celebrations
    Route::get('announcements', [App\Http\Controllers\EmployeeApp\AnnouncementController::class, 'index']);
    Route::get('announcements/featured', [App\Http\Controllers\EmployeeApp\AnnouncementController::class, 'featured']);
    Route::get('announcements/{id}', [App\Http\Controllers\EmployeeApp\AnnouncementController::class, 'show']);
    Route::get('celebrations', [App\Http\Controllers\EmployeeApp\CelebrationController::class, 'index']);
    Route::get('celebrations/my-wishes', [App\Http\Controllers\EmployeeApp\CelebrationController::class, 'myWishes']);
    Route::get('celebrations/{id}', [App\Http\Controllers\EmployeeApp\CelebrationController::class, 'show']);
    Route::post('celebrations/wish', [App\Http\Controllers\EmployeeApp\CelebrationController::class, 'storeWish']);

    // Notifications
    Route::get('notifications', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-all-read', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'markAllRead']);
    Route::post('notifications/{id}/read', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'markRead']);
    Route::delete('notifications/{id}', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'destroy']);
    Route::delete('notifications', [App\Http\Controllers\EmployeeApp\NotificationController::class, 'destroyAll']);

    // Attendance (Proactive)
    Route::get('attendance/shift-today', [App\Http\Controllers\EmployeeApp\AttendanceController::class, 'getShiftToday']);
    Route::post('attendance/device-bind', [App\Http\Controllers\EmployeeApp\AttendanceController::class, 'bindDevice']);
    Route::post('attendance/clock-in', [App\Http\Controllers\EmployeeApp\AttendanceController::class, 'scanClock']);

    // Push Subscriptions
    Route::post('push-subscriptions', [App\Http\Controllers\EmployeeApp\PushSubscriptionController::class, 'update']);
    Route::delete('push-subscriptions', [App\Http\Controllers\EmployeeApp\PushSubscriptionController::class, 'destroy']);
});

// Public PWA Info
Route::get('pwa/info', [App\Http\Controllers\Settings\PwaSettingController::class, 'publicInfo']);

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = \App\Models\Auth\User::findOrFail($id);
    if (!hash_equals((string) $id, (string) $user->getKey()))
        abort(403);
    if (!hash_equals(sha1($user->getEmailForVerification()), (string) $hash))
        abort(403);
    if (!$user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($user));
    }
    return redirect('/users/profile?verified=1');
})->middleware([\App\Http\Middleware\ValidateSignature::class])->name('verification.verify');
