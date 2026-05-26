<?php

namespace App\Services;

use App\Models\Communication\TelegramSetting;
use App\Models\Communication\TelegramBroadcastAction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class TelegramService
{
    public $botToken;
    public $enabled;
    private ?int $branchId;

    /**
     * Get the bot token from the primary source (DB) or fallback (.env)
     */
    public static function getBotToken(?int $branchId = null): ?string
    {
        $setting = TelegramSetting::instance($branchId);
        return $setting?->bot_token ?? config('services.telegram.bot_token');
    }

    public function __construct(?int $branchId = null)
    {
        $this->branchId = $branchId;
        $setting = TelegramSetting::instance($branchId);
        
        $this->botToken = self::getBotToken($branchId);
        $this->enabled = $setting?->is_active ?? ($this->botToken ? true : false);
    }

    /**
     * Send a message to a specific chat / topic.
     */
    public function sendMessage(string $chatId, string $message, ?string $topicId = null, bool $forceSend = false, ?array $replyMarkup = null): bool
    {
        return $this->sendMessageWithToken($this->botToken, $this->enabled, $chatId, $message, $topicId, $forceSend, $replyMarkup);
    }

    /**
     * Send a document to a specific chat / topic.
     */
    public function sendDocument(string $chatId, $fileContent, string $fileName, ?string $caption = null, ?string $topicId = null, bool $forceSend = false): bool
    {
        if (!$this->botToken) return false;
        if (!$this->enabled && !$forceSend) return false;

        $payload = [
            'chat_id' => $chatId,
            'parse_mode' => 'HTML',
        ];

        if ($caption) {
            $payload['caption'] = $caption;
        }

        if ($topicId) {
            $payload['message_thread_id'] = $topicId;
        }

        return $this->sendRequest('sendDocument', $payload, null, null, $fileContent, $fileName);
    }

    /**
     * Send a photo to a specific chat / topic.
     */
    public function sendPhoto(string $chatId, string $photoUrl, ?string $caption = null, ?string $topicId = null, bool $forceSend = false, ?array $replyMarkup = null): bool
    {
        if (!$this->botToken) return false;
        if (!$this->enabled && !$forceSend) return false;

        $appHost = parse_url(config('app.url'), PHP_URL_HOST);
        $requestHost = request()->getHost();
        $isLocal = str_contains($photoUrl, 'localhost') || 
                   str_contains($photoUrl, '127.0.0.1') || 
                   str_starts_with($photoUrl, '/') ||
                   (!str_starts_with($photoUrl, 'http')) || 
                   ($appHost && str_contains($photoUrl, $appHost)) ||
                   ($requestHost && str_contains($photoUrl, $requestHost));
        
        if (!$isLocal && str_contains($photoUrl, 'http://') && !str_contains($photoUrl, 'localhost') && !str_contains($photoUrl, '127.0.0.1')) {
            $photoUrl = str_replace('http://', 'https://', $photoUrl);
        }

        $payload = [
            'chat_id' => $chatId,
            'parse_mode' => 'HTML',
        ];

        if ($caption) {
            $payload['caption'] = $caption;
        }

        if ($topicId) {
            $payload['message_thread_id'] = $topicId;
        }

        if ($replyMarkup) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        if ($isLocal) {
            if (str_contains($photoUrl, 'storage/')) {
                try {
                    $storagePart = explode('storage/', $photoUrl)[1];
                    $disk = \Illuminate\Support\Facades\Storage::disk('public');
                    if ($disk->exists($storagePart)) {
                        $content = $disk->get($storagePart);
                        return $this->sendRequest('sendPhoto', $payload, null, null, $content, basename($storagePart));
                    }
                } catch (\Exception $e) {}
            }
        }

        if (!str_starts_with($photoUrl, 'http')) {
            $photoUrl = asset($photoUrl);
        }

        $payload['photo'] = $photoUrl;
        return $this->sendRequest('sendPhoto', $payload);
    }

    /**
     * Internal helper to send message with specific token/enabled state.
     */
    private function sendMessageWithToken(?string $botToken, bool $enabled, string $chatId, string $message, ?string $topicId = null, bool $forceSend = false, ?array $replyMarkup = null): bool
    {
        if (!$botToken) {
            return false;
        }

        if (!$enabled && !$forceSend) {
            return false;
        }

        $payload = [
            'chat_id' => $chatId,
            'text' => $message,
            'parse_mode' => 'HTML',
        ];

        if ($topicId) {
            $payload['message_thread_id'] = $topicId;
        }

        if ($replyMarkup) {
            $payload['reply_markup'] = json_encode($replyMarkup);
        }

        return $this->sendRequest('sendMessage', $payload, $botToken);
    }

    /**
     * Centralized request helper
     */
    private function sendRequest(string $method, array $payload, ?string $token = null, ?string $filePath = null, $fileContent = null, ?string $fileName = null): bool
    {
        $token = $token ?? $this->botToken;
        if (!$token) throw new \Exception("Telegram Bot Token is missing.");

        try {
            $url = "https://api.telegram.org/bot{$token}/{$method}";
            
            $request = ($filePath || $fileContent) ? Http::asMultipart() : Http::asJson();
            $request = $request->connectTimeout(5)->timeout(15);
            
            if ($filePath) {
                $fieldName = 'document';
                if ($method === 'sendPhoto') $fieldName = 'photo';
                if ($method === 'sendAudio') $fieldName = 'audio';
                if ($method === 'sendVideo') $fieldName = 'video';
                
                $request = $request->attach($fieldName, fopen($filePath, 'r'), basename($filePath));
            } elseif ($fileContent) {
                $fieldName = 'document';
                if ($method === 'sendPhoto') $fieldName = 'photo';
                if ($method === 'sendAudio') $fieldName = 'audio';
                if ($method === 'sendVideo') $fieldName = 'video';
                
                $request = $request->attach($fieldName, $fileContent, $fileName ?: 'upload.png');
            }

            $response = $request->post($url, $payload);

            if (!$response->successful()) {
                $errorDescription = $response->json('description') ?? $response->body();
                Log::warning("TelegramService::{$method} failed: {$errorDescription}", [
                    'status' => $response->status(),
                    'chat_id' => $payload['chat_id'] ?? 'unknown'
                ]);
                throw new \Exception("Telegram API Error: {$errorDescription}");
            }

            return $response->successful();
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Broadcast a message based on a system action key.
     * @param string $actionKey
     * @param mixed $model
     * @param array|null $overrideConfig Optional override for chat_id and topic_id (unit tests/previews)
     */
    public function broadcast(string $actionKey, $model, ?array $overrideConfig = null): bool
    {
        $message = $this->formatMessage($actionKey, $model, false);
        if (!$message) return false;

        $branchId = $this->branchId ?? $model->branch_id ?? null;

        $setting = TelegramSetting::instance($branchId);
        
        $config = null;
        if ($overrideConfig) {
            $config = (object) [
                'chat_id'       => $overrideConfig['chat_id'] ?? null,
                'topic_id'      => $overrideConfig['topic_id'] ?? null,
                'is_enabled'    => true,
                'custom_remark' => null
            ];
        }

        if (!$config) {
            $config = TelegramBroadcastAction::where('action_key', $actionKey)
                ->where('branch_id', $branchId)
                ->first();
                
            if (!$config) {
                $config = TelegramBroadcastAction::where('action_key', $actionKey)
                    ->whereNull('branch_id')
                    ->first();
            }
        }

        if (!$config || !$config->is_enabled || empty($config->chat_id)) {
            return false;
        }

        $message = $this->formatMessage($actionKey, $model);
        
        if (!empty($config->custom_remark)) {
            $message .= "\n\n💡 <b>Note:</b> " . $config->custom_remark;
        }

        return $this->sendMessageWithToken(
            $setting?->bot_token, 
            $setting?->is_active ?? false, 
            $config->chat_id, 
            $message, 
            $config->topic_id
        );
    }

    /**
     * Send the aggregated daily operational report to the management group.
     */
    public function sendDailyReport($report): bool
    {
        $message = $this->formatDailyReport($report);
        if (!$message) return false;

        $branchId = is_object($report) ? ($report->branch_id ?? null) : ($report['branch_id'] ?? null);
        $setting = TelegramSetting::instance($branchId);
        
        $config = TelegramBroadcastAction::where('action_key', 'system.daily_report')
            ->where('branch_id', $branchId)
            ->first() ?? TelegramBroadcastAction::where('action_key', 'system.daily_report')
            ->whereNull('branch_id')
            ->first();

        $targetChatId = $config?->chat_id ?? $setting?->global_chat_id;
        $targetTopicId = $config?->topic_id ?? $setting?->global_topic_id;
        $isEnabled = $config ? $config->is_enabled : true;

        if (empty($targetChatId)) {
            Log::warning("Cannot send daily report: No chat_id found in config or global settings.");
            return false;
        }

        return $this->sendMessageWithToken(
            $setting?->bot_token, 
            $setting?->is_active ?? false, 
            $targetChatId, 
            $message, 
            $targetTopicId,
            $isEnabled
        );
    }

    private function formatDailyReport($report): string
    {
        $isObject = is_object($report);
        
        $data = $isObject ? ($report->data ?? (array)$report) : (isset($report['report_data']) ? $report['report_data'] : (array)$report);
        $branchName = $isObject ? ($report->branch?->name ?? 'Global') : ($report['branch_name'] ?? 'Test Branch');
        $date = $isObject ? (is_string($report->report_date) ? \Carbon\Carbon::parse($report->report_date)->format('d M Y') : $report->report_date?->format('d M Y')) : (isset($report['report_date']) ? \Carbon\Carbon::parse($report['report_date'])->format('d M Y') : now()->format('d M Y'));
        $submitter = $isObject ? ($report->submitter?->name ?? 'System') : ($report['submitter_name'] ?? 'Tester');

        $hr = $data['hr'] ?? [];

        $lines = [
            "🏆 <b>DAILY SUMMARY REPORT</b> 🏆",
            "━━━━━━━━━━━━━━━━━━━━",
            "🏢 <b>Branch:</b> {$branchName}",
            "📅 <b>Date:</b> {$date}",
            "👤 <b>By:</b> {$submitter}",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "👥 <b>HR & ATTENDANCE</b>",
            "• Present: <b>" . ($hr['present'] ?? 0) . "</b>",
            "• Absent: <b>" . ($hr['absent'] ?? 0) . "</b>",
            "",
            "━━━━━━━━━━━━━━━━━━━━",
            "📍 <i>End of daily report.</i>",
        ];

        return implode("\n", $lines);
    }

    /**
     * Route formatting based on action key.
     */
    private function formatMessage(string $key, $model, bool $forCustomer = false): string
    {
        return match ($key) {
            'hr.leave_requested' => $this->formatLeaveRequest($model, '📅 NEW LEAVE REQUEST'),
            'hr.leave_approved'  => $this->formatLeaveRequest($model, '✅ LEAVE APPROVED'),
            'hr.leave_rejected'  => $this->formatLeaveRequest($model, '❌ LEAVE REJECTED'),
            'hr.employee_activity' => $this->formatActivity($model),
            'hr.activity_logged'   => $this->formatActivity($model),
            
            'attendance.clock_in'       => $this->formatAttendance($model, 'EMPLOYEE CLOCK-IN'),
            'attendance.session_1_out'  => $this->formatAttendance($model, 'EMPLOYEE LUNCH-OUT'),
            'attendance.session_2_in'   => $this->formatAttendance($model, 'EMPLOYEE LUNCH-IN'),
            'attendance.clock_out'      => $this->formatAttendance($model, 'EMPLOYEE CLOCK-OUT'),
            
            'system.daily_report'            => $this->formatDailyReport($model),
            
            default => "System Notification: {$key}",
        };
    }

    private function formatLeaveRequest($leave, $title): string
    {
        return implode("\n", [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Employee:</b> " . ($leave->employee?->full_name ?? 'N/A'),
            "<b>ID:</b> " . ($leave->employee?->employee_id ?? 'N/A'),
            "<b>Type:</b> " . ($leave->leaveType?->name ?? 'N/A'),
            "<b>Duration:</b> " . Carbon::parse($leave->start_date)->format('d M') . " to " . Carbon::parse($leave->end_date)->format('d M'),
            "<b>Total Days:</b> {$leave->total_days}",
            "<b>Reason:</b> " . ($leave->reason ?? 'N/A'),
            "<b>Status:</b> " . strtoupper($leave->status),
            "---------------------------",
        ]);
    }

    private function formatAttendance($record, $title): string
    {
        $isClockIn = str_contains($title, 'IN');
        
        $timeRaw = null;
        if (str_contains($title, 'CLOCK-IN')) {
            $timeRaw = $record->clock_in_time;
        } elseif (str_contains($title, 'LUNCH-OUT')) {
            $timeRaw = $record->session_1_out_time;
        } elseif (str_contains($title, 'LUNCH-IN')) {
            $timeRaw = $record->session_2_in_time;
        } elseif (str_contains($title, 'CLOCK-OUT')) {
            $timeRaw = $record->clock_out_time;
        }

        $time = $timeRaw ? Carbon::parse($timeRaw)->format('h:i A') : 'N/A';
        
        $relevantStatus = $isClockIn ? ($record->in_status ?? 'Present') : ($record->out_status ?? 'Present');
        
        $statusLower = strtolower($record->status ?? $relevantStatus);
        
        $emoji = match(true) {
            str_contains($statusLower, 'early') && !str_contains($statusLower, 'departure') => '🟢',
            str_contains($statusLower, 'overtime') || str_contains($statusLower, 'on time') || str_contains($statusLower, 'stay late') => '🟢',
            str_contains($statusLower, 'present') && !str_contains($statusLower, '/') => '🔵',
            str_contains($statusLower, 'warning') => '🟡',
            str_contains($statusLower, 'late') || str_contains($statusLower, 'early departure') => '🔴',
            default => '⚪'
        };

        $reason = $isClockIn ? $record->late_reason : $record->early_departure_reason;
        
        $lines = [
            "{$emoji} <b>{$title}</b>",
            "---------------------------",
            "<b>Employee:</b> " . ($record->employee?->full_name ?? 'N/A'),
            "<b>ID:</b> " . ($record->employee?->employee_id ?? 'N/A'),
            "<b>Time:</b> {$time}",
        ];

        if ($isClockIn) {
            $lines[] = "<b>Status:</b> " . ($record->status ?? $relevantStatus);
        }

        $lines[] = "<b>Location:</b> " . ($record->branch?->name ?? 'N/A');
        $lines[] = "---------------------------";

        if ($reason) {
            $lines[] = "<b>💡 Reason:</b> <i>{$reason}</i>";
            $lines[] = "---------------------------";
        }

        return implode("\n", $lines);
    }

    private function formatActivity($activity): string
    {
        $type = $activity->activity_type ?? 'Field Activity';
        $emoji = match (true) {
            str_contains($type, 'Sale') => '📍',
            str_contains($type, 'Site Visit') => '🏢',
            str_contains($type, 'On-Site Service') => '🛠️',
            str_contains($type, 'Meeting') => '💬',
            str_contains($type, 'Delivery') => '📦',
            str_contains($type, 'Training') => '🎓',
            str_contains($type, 'Support') => '🎧',
            default => '📝',
        };

        $locationLink = "";
        if ($activity->latitude && $activity->longitude) {
            $url = "https://www.google.com/maps?q={$activity->latitude},{$activity->longitude}";
            $locName = $activity->location_name ?? "View Location";
            $locationLink = "<b>Location:</b> <a href='{$url}'>{$locName}</a>";
        }

        $lines = [
            "{$emoji} <b>EMPLOYEE ACTIVITY LOG</b>",
            "---------------------------",
            "<b>Employee:</b> " . ($activity->employee?->full_name ?? 'N/A'),
            "<b>ID:</b> " . ($activity->employee?->employee_id ?? 'N/A'),
            "<b>Type:</b> {$type}",
            "<b>Note:</b> " . ($activity->comment ?? 'No details'),
            "<b>Time:</b> " . Carbon::parse($activity->submitted_at)->format('d M Y, h:i A'),
        ];

        if ($locationLink) {
            $lines[] = $locationLink;
        }

        $lines[] = "---------------------------";
        
        return implode("\n", $lines);
    }

    /**
     * Test the bot connection and optionally send a test message.
     */
    public function testConnection(): array
    {
        $setting = TelegramSetting::instance();
        $botToken = $setting?->bot_token ?? config('services.telegram.bot_token');
        if (!$botToken) return ['success' => false, 'message' => 'Bot token not configured.'];

        try {
            $response = Http::get("https://api.telegram.org/bot{$botToken}/getMe");
            if (!$response->successful()) {
                return ['success' => false, 'message' => $response->json('description') ?? 'Invalid Bot Token'];
            }

            $bot = $response->json('result');
            $message = "Connected as @{$bot['username']} (" . ($setting?->is_active ? 'Active' : 'Disabled') . ")";

            if ($setting->global_chat_id) {
                $testMsg = "📡 <b>System Test Connection</b>\n";
                $testMsg .= "---------------------------\n";
                $testMsg .= "Status: Connection Successful ✅\n";
                $testMsg .= "Time: " . now()->format('d-M-Y h:i:s A') . "\n";
                $testMsg .= "---------------------------\n";
                $testMsg .= "This is a test message to verify your global configuration.";

                $sent = $this->sendMessage(
                    $setting->global_chat_id, 
                    $testMsg, 
                    $setting->global_topic_id, 
                    true
                );
                
                if ($sent) {
                    $message .= ". Test message sent to Global Chat.";
                } else {
                    $message .= ". Failed to send test message (Check Chat ID/Topic ID).";
                }
            } else {
                $message .= ". No Global Chat ID set for test message.";
            }

            return [
                'success' => true,
                'message' => $message,
                'bot' => $bot,
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Format an announcement for Telegram.
     */
    public function formatAnnouncementMessage(\App\Models\System\Announcement $announcement): string
    {
        $emoji = match($announcement->type) {
            'success' => '✅',
            'warning' => '⚠️',
            'danger' => '🚨',
            default => '📢',
        };

        $lines = [
            "{$emoji} <b>{$announcement->title}</b>",
            "",
        ];

        if ($announcement->short_description) {
            $lines[] = "<i>{$announcement->short_description}</i>";
            $lines[] = "";
        }

        if ($announcement->content) {
            $content = strip_tags($announcement->content, '<b><i><u><s><code><pre><a>');
            $lines[] = $content;
        }

        return implode("\n", $lines);
    }

    public function sendOTP(string $chatId, string $otp): bool
    {
        $message = "🔐 <b>Your 2FA Login Code</b>\n\n";
        $message .= "Your verification code is: <code>{$otp}</code>\n\n";
        $message .= "This code will expire in 5 minutes. If you did not request this, please change your password immediately.";

        return $this->sendMessage($chatId, $message, null, true);
    }

    /**
     * Verify the data received from the Telegram Login Widget.
     *
     * @param array $authData
     * @return bool
     */
    public function verifyAuthData(array $authData): bool
    {
        if (!isset($authData['hash'])) {
            return false;
        }

        $checkHash = $authData['hash'];
        unset($authData['hash']);

        $dataCheckArr = [];
        foreach ($authData as $key => $value) {
            if ($value !== null) {
                $dataCheckArr[] = $key . '=' . $value;
            }
        }
        sort($dataCheckArr);
        $dataCheckString = implode("\n", $dataCheckArr);

        $secretKey = hash('sha256', $this->botToken, true);
        $hash = hash_hmac('sha256', $dataCheckString, $secretKey);

        if (strcmp($hash, $checkHash) !== 0) {
            return false;
        }

        if (isset($authData['auth_date']) && (time() - $authData['auth_date']) > 86400) {
            return false;
        }

        return true;
    }
}
