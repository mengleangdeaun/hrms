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
                   (!str_starts_with($photoUrl, 'http')) || // Any path without http is considered local
                   ($appHost && str_contains($photoUrl, $appHost)) ||
                   ($requestHost && str_contains($photoUrl, $requestHost));
        
        // Telegram requires HTTPS for external URLs. Force it if not on localhost.
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
            // Use Storage abstraction (supports S3 and other drivers)
            // This is the most reliable method as it bypasses physical path resolution issues.
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

        // If we reach here, we are sending a URL. Ensure it is absolute.
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
            // Rethrow so the caller (controller) can catch the specific error message
            throw $e;
        }
    }

    /**
     * Notify a specific customer about an event.
     * Can pass customer object directly or let it be pulled from model.
     */
    public function notifyCustomer($actionKeyOrCustomer, $modelOrActionKey = null, $model = null): bool
    {
        $customer = null;
        $actionKey = '';
        $actualModel = null;

        // Signature 1: ($customer, $actionKey, $model)
        if (is_object($actionKeyOrCustomer) && is_string($modelOrActionKey)) {
            $customer = $actionKeyOrCustomer;
            $actionKey = $modelOrActionKey;
            $actualModel = $model;
        } 
        // Signature 2: ($actionKey, $model)
        else {
            $actionKey = $actionKeyOrCustomer;
            $actualModel = $modelOrActionKey;
            $customer = $actualModel->customer ?? null;
        }

        if (!$customer || empty($customer->telegram_user_id)) {
            Log::warning("Cannot notify customer: No linked Telegram ID for customer", ['customer_id' => $customer?->id]);
            return false;
        }

        if ($customer && !$customer->tma_notifications_enabled) {
            return false;
        }

        // Handle specific logic for Job Cards (Rating button)
        $replyMarkup = null;
        if (str_contains($actionKey, 'services.job_')) {
            $status = strtoupper(trim($actualModel->status ?? ''));
            $isCompleted = in_array($status, ['READY', 'DELIVERED', 'COMPLETED', 'CLOSED']);
            
            if ($isCompleted) {
                $setting = TelegramSetting::instance($actualModel->branch_id);
                $botUsername = $setting?->bot_username ?? config('services.telegram.bot_username', 'sccg_bot');
                
                $replyMarkup = [
                    'inline_keyboard' => [
                        [
                            [
                                'text' => '⭐ វាយតម្លៃសេវាកម្ម (Rate Now)',
                                 'url' => "https://la3la3.site/crm/tma/history"
                            ]
                        ]
                    ]
                ];
            }
        }

        // Use custom customer formatting if available, otherwise fallback to standard message
        if (str_contains($actionKey, 'services.job_')) {
            $message = $this->formatCustomerJobCard($actualModel, '🔵 បច្ចុប្បន្នភាពពីរថយន្តរបស់លោកអ្នក');
        } else {
            $message = $this->formatMessage($actionKey, $actualModel, true);
        }

        return $this->sendMessageWithToken($this->botToken, $this->enabled, $customer->telegram_user_id, $message, null, true, $replyMarkup);
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

        // Configuration Context: Identify which bot/alert settings to use
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
                
            // Fallback to Global alert config if branch-specific one doesn't exist
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
    public function sendDailyReport(\App\Models\System\DailyReport $report): bool
    {
        $message = $this->formatDailyReport($report);
        if (!$message) return false;

        $branchId = $report->branch_id;
        $setting = TelegramSetting::instance($branchId);
        
        // Find configuration for daily report alert
        $config = TelegramBroadcastAction::where('action_key', 'system.daily_report')
            ->where('branch_id', $branchId)
            ->first() ?? TelegramBroadcastAction::where('action_key', 'system.daily_report')
            ->whereNull('branch_id')
            ->first();

        // Target Configuration: Use specific action config, or fallback to global settings
        $targetChatId = $config?->chat_id ?? $setting?->global_chat_id;
        $targetTopicId = $config?->topic_id ?? $setting?->global_topic_id;
        $isEnabled = $config ? $config->is_enabled : true; // Default to enabled if no config record

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
            $isEnabled // Pass as forceSend if the setting is active but specific config is used
        );
    }

    private function formatDailyReport($report): string
    {
        $isModel = $report instanceof \App\Models\System\DailyReport;
        
        $data = $isModel ? $report->data : (isset($report->report_data) ? $report->report_data : (array)$report);
        $branchName = $isModel ? ($report->branch?->name ?? 'Global') : ($report->branch_name ?? 'Test Branch');
        $date = $isModel ? $report->report_date->format('d M Y') : (isset($report->report_date) ? \Carbon\Carbon::parse($report->report_date)->format('d M Y') : now()->format('d M Y'));
        $submitter = $isModel ? ($report->submitter?->name ?? 'System') : ($report->submitter_name ?? 'Tester');

        $crm = $data['crm'] ?? [];
        $sales = $data['sales'] ?? [];
        $finance = $data['finance'] ?? [];
        $hr = $data['hr'] ?? [];
        $workshop = $data['workshop'] ?? [];
        $inventory = $data['inventory'] ?? [];

        $lines = [
            "🏆 <b>DAILY SUMMARY REPORT</b> 🏆",
            "━━━━━━━━━━━━━━━━━━━━",
            "🏢 <b>Branch:</b> {$branchName}",
            "📅 <b>Date:</b> {$date}",
            "👤 <b>By:</b> {$submitter}",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            "📊 <b>CRM & SALES PERFORMANCE</b>",
            "• Total Leads: <b>" . ($crm['total'] ?? 0) . "</b>",
            "• Leads Lost: <b>" . ($crm['lost'] ?? 0) . "</b>",
        ];

        if (!empty($crm['lost_reasons'])) {
            foreach ($crm['lost_reasons'] as $reason => $count) {
                $lines[] = "  └ <i>{$reason}: {$count}</i>";
            }
        }

        $lines[] = "• Sales Count: <b>" . ($sales['total_count'] ?? 0) . "</b>";
        $lines[] = "• Total Revenue: <b>$" . number_format($finance['collected'] ?? 0, 2) . "</b>";
        $lines[] = "";
        
        $lines[] = "🛠 <b>WORKSHOP OPERATIONS</b>";
        $lines[] = "• Jobs Completed: <b>" . ($workshop['completed_jobs'] ?? 0) . "</b>";
        
        if (!empty($workshop['breakdown'])) {
            foreach ($workshop['breakdown'] as $service => $count) {
                $lines[] = "  └ <i>{$service}: {$count}</i>";
            }
        }

        $lines[] = "• Total Task Load: <b>" . ($workshop['total_tasks'] ?? 0) . "</b>";
        $lines[] = "• Avg Cycle Time: <b>" . ($workshop['avg_completion_time'] ?? 'N/A') . "</b>";
        $lines[] = "• Avg CSAT: <b>" . number_format($workshop['avg_service_rating'] ?? 0, 1) . " / 5.0</b>";
        $lines[] = "";

        $lines[] = "👥 <b>HR & ATTENDANCE</b>";
        $lines[] = "• Present: <b>" . ($hr['present'] ?? 0) . "</b>";
        $lines[] = "• Absent: <b>" . ($hr['absent'] ?? 0) . "</b>";
        $lines[] = "";

        $lines[] = "📦 <b>INVENTORY & LOGISTICS</b>";
        $lines[] = "• Total Movements: <b>" . ($inventory['movements'] ?? 0) . "</b>";
        
        if (!empty($inventory['movement_records'])) {
            foreach ($inventory['movement_records'] as $m) {
                $product = $m['product_name'] ?? 'Unknown';
                $serial = $m['serial_number'] ? " (<code>{$m['serial_number']}</code>)" : "";
                $qty = $m['quantity'] >= 0 ? "+{$m['quantity']}" : $m['quantity'];
                $type = strtoupper($m['type'] ?? 'MOVE');
                $lines[] = "  └ <i>{$type}: {$product}{$serial}</i> <b>{$qty}</b> [Bal: {$m['balance']}]";
            }
            $lines[] = "";
        }

        $lines[] = "• Popular Part: <b>" . ($inventory['popular_part'] ?? 'N/A') . "</b>";
        $lines[] = "• Damages Reported: <b>" . ($inventory['damages'] ?? 0) . "</b>";
        
        if (!empty($inventory['damage_records'])) {
            $lines[] = "";
            $lines[] = "🧨 <b>INCIDENT LOGS:</b>";
            foreach ($inventory['damage_records'] as $d) {
                $ref = $d['serial_number'] ? "<code>{$d['serial_number']}</code>" : ($d['job_no'] ? "Job #{$d['job_no']}" : "Stock Loss");
                $qty = $d['quantity'] ? " <b>(-" . $d['quantity'] . " sqm)</b>" : "";
                $product = $d['product_name'] ? " | {$d['product_name']}" : "";
                $lines[] = "  ◈ {$ref}{$product}{$qty}";
                
                if (!empty($d['mistake_by'])) {
                    $lines[] = "    ❌ <i>Mistake Liability: " . implode(', ', $d['mistake_by']) . "</i>";
                }
                if (!empty($d['rework_by'])) {
                    $lines[] = "    🛠 <i>Rework Team: " . implode(', ', $d['rework_by']) . "</i>";
                }
            }
        }
        
        $lines[] = "";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "📍 <i>End of daily report.</i>";

        return implode("\n", $lines);
    }



    /**
     * Route formatting based on action key.
     */
    private function formatMessage(string $key, $model, bool $forCustomer = false): string
    {
        return match ($key) {
            'sales.order_created'    => $this->formatSalesOrder($model, '🆕 NEW SALES ORDER'),
            'sales.order_cancelled'  => $this->formatSalesOrder($model, '❌ ORDER CANCELLED'),
            
            'sales.payment_received' => $this->formatPaymentReceived($model),
            'sales.shift_opened'     => $this->formatSaleShift($model, '🟩 SHIFT OPENED'),
            'sales.shift_closed'     => $this->formatSaleShift($model, '🟥 SHIFT CLOSED (SUMMARY)'),
            
            'procurement.po_created' => $this->formatPurchaseOrder($model),
            'procurement.po_followup' => $this->formatPurchaseOrder($model, '⚠️ OVERDUE PO FOLLOW-UP'),
            'procurement.receive_completed' => $this->formatPurchaseReceive($model),
            
            'services.job_status_updated' => $this->formatJobCard($model, '🛠️ JOB STATUS UPDATE'),
            'services.job_completed'      => $this->formatJobCard($model, '✅ JOB COMPLETED'),
            'services.qc_passed'          => $this->formatQCReport($model, '🏅 QC AUDIT PASSED'),
            'services.qc_failed'          => $this->formatQCReport($model, '⚠️ QC AUDIT FAILED'),
            'services.qc_audit_completed' => $this->formatQCReport($model, ($model->rating ?? 0) >= 4 ? '🏅 QC AUDIT PASSED' : '⚠️ QC AUDIT FAILED'),
            'services.damage_reported'    => $this->formatDamageReport($model),
            
            'hr.leave_requested' => $this->formatLeaveRequest($model, '📅 NEW LEAVE REQUEST'),
            'hr.leave_approved'  => $this->formatLeaveRequest($model, '✅ LEAVE APPROVED'),
            'hr.leave_rejected'  => $this->formatLeaveRequest($model, '❌ LEAVE REJECTED'),
            'hr.employee_activity' => $this->formatActivity($model),
            'hr.activity_logged'   => $this->formatActivity($model),
            
            'attendance.clock_in'       => $this->formatAttendance($model, 'EMPLOYEE CLOCK-IN'),
            'attendance.session_1_out'  => $this->formatAttendance($model, 'EMPLOYEE LUNCH-OUT'),
            'attendance.session_2_in'   => $this->formatAttendance($model, 'EMPLOYEE LUNCH-IN'),
            'attendance.clock_out'      => $this->formatAttendance($model, 'EMPLOYEE CLOCK-OUT'),
            
            'inventory.stock_adjustment' => $this->formatStockAdjustment($model, '⚖️ STOCK ADJUSTMENT'),
            'inventory.stock_transfer'   => $this->formatStockTransfer($model, '🚚 STOCK TRANSFER'),
            
            'crm.customer_feedback_received' => $this->formatCustomerFeedback($model),
            'crm.job_card_rating_received'   => $this->formatJobCardRating($model),
            'crm.booking_created'            => $this->formatBookingMessage($model, $forCustomer),
            'crm.booking_updated'            => $this->formatBookingStatusUpdate($model, $forCustomer),
            
            'system.daily_report'            => $this->formatDailyReport($model),
            
            default => "System Notification: {$key}",
        };
    }

    private function formatSalesOrder($order, $title): string
    {
        $discountInfo = "None";
        if ($order->discount_total > 0) {
            $type = ($order->discount_type === 'PERCENT') ? "({$order->discount_value}%)" : "";
            $discountInfo = "-$" . number_format($order->discount_total, 2) . " " . $type;
        }

        $taxInfo = ($order->tax_total > 0) ? "$" . number_format($order->tax_total, 2) : "NO VAT";

        // Build itemized list for Second Block
        $itemLines = [];
        if ($order->items && $order->items->count() > 0) {
            foreach ($order->items as $item) {
                $partName = $item->jobPart?->name ?? null;
                $productName = $item->product?->name ?? ($item->itemable_type === \App\Models\Inventory\Product::class ? $item->item_name : null);
                
                if ($partName || $productName) {
                    $itemLines[] = "• " . trim(($partName ? $partName . ": " : "") . ($productName ?? ""));
                }
            }
        }

        return implode("\n", array_filter([
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Order No:</b> <code>{$order->order_no}</code>",
            "<b>Customer:</b> " . ($order->customer?->name ?? 'N/A'),
            "<b>Vehicle:</b> " . ((isset($order->vehicle) && isset($order->vehicle->plate_number)) ? $order->vehicle->plate_number : 'N/A'),
            !empty($itemLines) ? implode("\n", $itemLines) : null,
            "---------------------------",
            "<b>Subtotal:</b> $" . number_format($order->subtotal, 2),
            "<b>Discount:</b> {$discountInfo}",
            "<b>VAT:</b> {$taxInfo}",
            "<b>Total:</b> $" . number_format($order->grand_total, 2),
            "<b>Note:</b> " . ($order->notes ?? 'N/A'),
            "---------------------------",
            "<b>By:</b> " . ($order->creator?->name ?? 'System'),
        ]));
    }

    private function formatPaymentReceived($deposit): string
    {
        $order = $deposit->order ?? null;
        return implode("\n", [
            "<b>💰 PAYMENT RECEIVED</b>",
            "---------------------------",
            "<b>Order No:</b> <code>" . ($order?->order_no ?? 'N/A') . "</code>",
            "<b>Amount:</b> $" . number_format($deposit->amount ?? 0, 2),
            "<b>Account:</b> " . ($deposit->paymentAccount?->name ?? $deposit->paymentAccount?->full_name ?? 'Default'),
            "<b>Date:</b> " . (Carbon::parse($deposit->deposit_date ?? now())->format('d-M-Y')),
            "---------------------------",
            "<b>Total Paid:</b> $" . number_format($order?->paid_amount ?? $deposit->amount ?? 0, 2),
            "<b>Balance:</b> $" . number_format($order?->balance_amount ?? 0, 2),
            "---------------------------",
            "<b>Received By:</b> " . ($deposit->creator?->name ?? $deposit->creator?->full_name ?? 'System'),
        ]);
    }

    private function formatSaleShift($shift, $title): string
    {
        $user = $shift->user ?? null;
        $branch = $shift->branch ?? null;
        
        $openedAt = $shift->opened_at ? Carbon::parse($shift->opened_at) : null;
        $closedAt = $shift->closed_at ? Carbon::parse($shift->closed_at) : null;
        
        $time = 'N/A';
        if ($closedAt) {
            $time = $closedAt->format('h:i A');
        } elseif ($openedAt) {
            $time = $openedAt->format('h:i A');
        }

        $lines = [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Branch:</b> " . ($branch?->name ?? 'N/A'),
            "<b>User:</b> " . ($user?->name ?? 'N/A'),
            "<b>Time:</b> {$time}",
            "---------------------------",
        ];

        if ($shift->status === 'closed' || $closedAt) {
            $lines[] = "<b>Total Sales:</b> " . ($shift->total_sales_count ?? 0);
            $lines[] = "<b>Total Collected:</b> $" . number_format($shift->total_amount_collected ?? 0, 2);
            $lines[] = "---------------------------";
            
            if (!empty($shift->account_summary) && (is_array($shift->account_summary) || is_object($shift->account_summary))) {
                $lines[] = "<b>Breakdown by Account:</b>";
                foreach ($shift->account_summary as $acc) {
                    $acc = (array)$acc;
                    $lines[] = "• " . ($acc['name'] ?? 'Account') . ": $" . number_format($acc['amount'] ?? 0, 2);
                }
                $lines[] = "---------------------------";
            }
        }

        return implode("\n", $lines);
    }

    private function formatPurchaseOrder($po, $title = '📦 NEW PURCHASE ORDER'): string
    {
        $itemLines = [];
        if (isset($po->items) && method_exists($po->items, 'count') && $po->items->count() > 0) {
            foreach ($po->items as $item) {
                $productName = $item->product?->name ?? 'Unknown Product';
                $qty = $item->order_qty + 0;
                $itemLines[] = "• {$productName} x {$qty}";
            }
        } else {
            $itemLines[] = "• N/A";
        }

        $itemsString = implode("\n", $itemLines);

        return implode("\n", array_filter([
            "<b>{$title}</b>",
            "---------------------------",
            "<b>PO No:</b> <code>{$po->po_number}</code>",
            "<b>Supplier:</b> " . ((isset($po->supplier) && isset($po->supplier->name)) ? $po->supplier->name : 'N/A'),
            ($po->expected_delivery_date) ? "<b>Delivery:</b> " . \Carbon\Carbon::parse($po->expected_delivery_date)->format('d-M-Y') : null,
            "<b>Items:</b>\n" . $itemsString,
            "<b>Total:</b> $" . number_format($po->grand_total ?? $po->total_amount ?? 0, 2),
            ($po->note) ? "<b>Note:</b> " . $po->note : null,
            "---------------------------",
            "<b>By:</b> " . ($po->creator?->name ?? 'System'),
        ]));
    }

    private function formatPurchaseReceive($receive): string
    {
        $itemLines = [];
        if (isset($receive->items) && method_exists($receive->items, 'count') && $receive->items->count() > 0) {
            foreach ($receive->items as $item) {
                $productName = $item->product?->name ?? 'Unknown Product';
                $qty = $item->qty_received + 0;
                $itemLines[] = "• {$productName} x {$qty}";
            }
        } else {
            $itemLines[] = "• N/A";
        }

        $itemsString = implode("\n", $itemLines);

        return implode("\n", array_filter([
            "<b>✅ STOCK RECEIVED</b>",
            "---------------------------",
            "<b>PR No:</b> <code>{$receive->receive_number}</code>",
            "<b>From PO:</b> <code>" . ($receive->purchaseOrder?->po_number ?? 'N/A') . "</code>",
            "<b>Supplier:</b> " . ($receive->purchaseOrder?->supplier?->name ?? 'N/A'),
            "<b>Location:</b> " . ($receive->location?->name ?? 'N/A'),
            "<b>Date:</b> " . Carbon::parse($receive->receive_date)->format('d-M-Y'),
            "<b>Items:</b>\n" . $itemsString,
            ($receive->reference_number) ? "<b>Reference:</b> " . $receive->reference_number : null,
            ($receive->receiving_note) ? "<b>Note:</b> " . $receive->receiving_note : null,
            "---------------------------",
            "<b>By:</b> " . ($receive->creator?->name ?? auth()->user()?->name ?? 'System'),
        ]));
    }

    private function formatJobCard($job, $title): string
    {
        $vehicle = $job->vehicle ?? null;
        $vehicleInfo = (isset($vehicle->plate_number) && $vehicle->plate_number) 
            ? $vehicle->plate_number 
            : ((isset($vehicle->vin_last_4) && $vehicle->vin_last_4) ? "VIN: " . $vehicle->vin_last_4 : 'N/A');
        
        $brandName = (isset($vehicle->brand) && $vehicle->brand) ? ($vehicle->brand->name ?? null) : null;
        $modelName = (isset($vehicle->model) && $vehicle->model) ? ($vehicle->model->name ?? null) : null;
        $vehicleModel = trim(($brandName ? $brandName . " " : "") . ($modelName ?? ($brandName ? "" : 'N/A')));

        $lines = [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Job No:</b> <code>{$job->job_no}</code>",
            "<b>ម៉ូដែល:</b> {$vehicleModel}",
            "<b>ស្លាកលេខ/លេខតួ:</b> {$vehicleInfo}",
            "<b>មេជាង:</b> " . ($job->leadTechnician?->full_name ?? 'Unassigned'),
            "<b>Status:</b> " . strtoupper($job->status),
            "---------------------------",
            "<b>Update:</b>",
        ];

if ($job->items && $job->items->count() > 0) {
    foreach ($job->items as $item) {
        $name = $item->part?->name ?? $item->service?->name ?? 'Task';
        $percent = $item->completion_percentage ?? 0;

        if ($percent == 0) {
            $status = "មិនទាន់បានបិត";
        } elseif ($percent >= 100) {
            $status = "បិតរួចរាល់ ✅";
        } else {
            $status = "បិតបាន {$percent}%";
        }

        $lines[] = "• {$name} {$status}";
    }
}

        $lines[] = "---------------------------";
        return implode("\n", $lines);
    }

    private function formatCustomerJobCard($job, $title): string
    {
        $vehicleInfo = $job->vehicle?->plate_number ?: ($job->vehicle?->vin_last_4 ? "VIN: " . $job->vehicle->vin_last_4 : 'N/A');

        $brand = $job->vehicle?->brand?->name;
        $model = $job->vehicle?->model?->name;
        $vehicleModel = trim(($brand ? $brand . " " : "") . ($model ?? ($brand ? "" : 'N/A')));

        $lines = [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>ម៉ូដែល:</b> {$vehicleModel}",
            "<b>ស្លាកលេខ/លេខតួ:</b> {$vehicleInfo}",
            "---------------------------",
            "<b>Update ការងារ:</b>",
        ];

        if ($job->items && $job->items->count() > 0) {
            foreach ($job->items as $item) {
                $name = $item->part?->name ?? $item->service?->name ?? 'Service Task';
                $percent = $item->completion_percentage ?? 0;
                
                $status = ($percent >= 100) ? "បិតរួចរាល់ ✅" : "បិតបាន {$percent}%";
                $lines[] = "• {$name} {$status}";
            }
        } else {
            $lines[] = "<i>មិនមានទិន្នន័យ.</i>";
        }

        $lines[] = "---------------------------";
        
        $status = strtoupper(trim($job->status ?? ''));
        $isFinishedStatus = in_array($status, ['READY', 'DELIVERED', 'COMPLETED', 'CLOSED']);
        
        $allItemsDone = $job->items && $job->items->count() > 0 && $job->items->every(fn($item) => (int)$item->completion_percentage >= 100);

        if ($isFinishedStatus) {
            $lines[] = "សូមអរគុណចំពោះការរង់ចាំ! សូមវាយតម្លៃសេវាកម្មយើងខ្ញុំដោយចុចប៊ូតុងខាងក្រោម";
        } elseif ($allItemsDone) {
            $lines[] = "សេវាកម្មរថយន្តរបស់លោកអ្នកត្រូវបានបញ្ចប់រួចរាល់! ក្រុមការងារយើងខ្ញុំកំពុងត្រួតពិនិត្យចុងក្រោយ។";
        } else {
            $lines[] = "ក្រុមការងារយើងខ្ញុំកំពុងរៀបចំរថយន្តរបស់លោកអ្នក។ សូមអរគុណចំពោះការរង់ចាំ!";
        }

        return implode("\n", $lines);
    }

    private function formatQCReport($report, $title): string
    {
        return implode("\n", [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Order:</b> #" . ($report->jobCard?->job_no ?? 'N/A'),
            "<b>Plate:</b> " . ((isset($report->jobCard) && isset($report->jobCard->vehicle) && isset($report->jobCard->vehicle->plate_number)) ? $report->jobCard->vehicle->plate_number : 'N/A'),
            "<b>QC No:</b> <code>" . ($report->qc_no ?? $report->id) . "</code>",
            "<b>Rating:</b> {$report->rating}.0 / 5.0",
            "<b>Reviewer:</b> " . ($report->qcPerson?->full_name ?? 'N/A'),
            "---------------------------",
        ]);
    }

    private function formatDamageReport($damage): string
    {
        $isJobCard = !!$damage->job_card_id;
        $jobNo = $damage->jobCard?->job_no ?? 'N/A';
        $partName = $damage->jobCardItem?->part?->name ?? $damage->serial?->product?->name ?? 'General Damage';
        
        $mistakeStaffNames = [];
        if (!empty($damage->mistake_staff_ids)) {
            $mistakeStaffNames = \App\Models\HR\Employee::whereIn('id', $damage->mistake_staff_ids)->pluck('full_name')->toArray();
        }

        $reworkStaffNames = [];
        if (!empty($damage->rework_staff_ids)) {
            $reworkStaffNames = \App\Models\HR\Employee::whereIn('id', $damage->rework_staff_ids)->pluck('full_name')->toArray();
        }

        $reasonName = $damage->damageType?->name ?? $damage->reason?->name ?? 'N/A';
        
        $lines = [
            "<b>🚨 NEW DAMAGE REPORTED</b>",
            "---------------------------",
            "<b>Type:</b> " . ($isJobCard ? "🛠 Job Card Damage" : "📦 General Stock Loss"),
        ];

        if ($isJobCard) {
            $lines[] = "<b>Job No:</b> <code>{$jobNo}</code>";
            $lines[] = "<b>Component:</b> {$partName}";
        } else {
            $lines[] = "<b>Product:</b> {$partName}";
        }

        if (isset($damage->serial) && $damage->serial) {
            $lines[] = "<b>Serial:</b> <code>" . ($damage->serial->serial_number ?? 'N/A') . "</code>";
        }

        if ($damage->quantity) {
            $dims = "";
            if ($damage->width && $damage->height) {
                $dims = " ({$damage->width} x {$damage->height})";
            }
            $lines[] = "<b>Loss Qty:</b> " . number_format($damage->quantity, 2) . " sqm{$dims}";
        }

        $lines[] = "<b>Reason:</b> {$reasonName}";

        if (!empty($mistakeStaffNames)) {
            $lines[] = "<b>Mistake By:</b> " . implode(', ', $mistakeStaffNames);
        }

        if (!empty($reworkStaffNames)) {
            $lines[] = "<b>Rework By:</b> " . implode(', ', $reworkStaffNames);
        }

        if ($damage->notes) {
            $lines[] = "<b>Notes:</b> <i>{$damage->notes}</i>";
        }

        $lines[] = "---------------------------";

        return implode("\n", $lines);
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
        
        // Find the most relevant time field based on title
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
        
        // Determine status and emoji based on the specific action (In or Out)
        $relevantStatus = $isClockIn ? ($record->in_status ?? 'Present') : ($record->out_status ?? 'Present');
        
        // Determine emoji using fuzzy matching on the status string
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

        // Only show Status for Clock-in actions
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

    private function formatStockAdjustment($adjustment, $title): string
    {
        $itemsText = "";
        if ($adjustment->items && $adjustment->items->count() > 0) {
            foreach ($adjustment->items as $index => $item) {
                $productName = $item->product?->name ?? 'Unknown';
                $qty = $item->adjustment_qty > 0 ? "+{$item->adjustment_qty}" : $item->adjustment_qty;
                $itemsText .= "\n" . ($index + 1) . ". {$productName} (<code>{$qty}</code>)";
            }
        }

        return implode("\n", [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Adj No:</b> <code>{$adjustment->adjustment_no}</code>",
            "<b>Date:</b> " . Carbon::parse($adjustment->date)->format('d M Y'),
            "<b>Items:</b> " . ($adjustment->items?->count() ?? '0') . $itemsText,
            "<b>Status:</b> " . strtoupper($adjustment->status),
            "<b>Reason:</b> " . ($adjustment->notes ?? 'N/A'),
            "---------------------------",
            "<b>By:</b> " . ($adjustment->user?->name ?? 'System'),
        ]);
    }

    private function formatStockTransfer($transfer, $title): string
    {
        $itemsText = "";
        if ($transfer->items && $transfer->items->count() > 0) {
            foreach ($transfer->items as $index => $item) {
                $productName = $item->product?->name ?? 'Unknown';
                $itemsText .= "\n" . ($index + 1) . ". {$productName} (<code>{$item->qty}</code>)";
            }
        }

        return implode("\n", [
            "<b>{$title}</b>",
            "---------------------------",
            "<b>Transfer No:</b> <code>{$transfer->transfer_no}</code>",
            "<b>From:</b> " . ($transfer->fromLocation?->name ?? 'N/A'),
            "<b>To:</b> " . ($transfer->toLocation?->name ?? 'N/A'),
            "<b>Date:</b> " . Carbon::parse($transfer->date)->format('d M Y'),
            "<b>Items:</b> " . ($transfer->items?->count() ?? '0') . $itemsText,
            "<b>Status:</b> " . strtoupper($transfer->status),
            "---------------------------",
            "<b>By:</b> " . ($transfer->user?->name ?? 'System'),
        ]);
    }

    private function formatCustomerFeedback($feedback): string
    {
        $stars = str_repeat('⭐', (int)$feedback->overall_rating);
        $csStars = str_repeat('⭐', (int)$feedback->customer_service_rating);
        $techStars = str_repeat('⭐', (int)$feedback->technical_team_rating);

        $lines = [
            "<b>📣 NEW CUSTOMER FEEDBACK</b>",
            "---------------------------",
            "<b>Branch:</b> " . ($feedback->branch?->name ?? 'N/A'),
            "<b>Service:</b> " . ($feedback->service?->name ?? 'N/A'),
            "<b>Overall Rating:</b> {$stars} ({$feedback->overall_rating}/5)",
            "---------------------------",
            "<b>CS Rating:</b> {$csStars}",
            "<b>Tech Rating:</b> {$techStars}",
            "<b>Phone:</b> " . ($feedback->phone_number ?? 'N/A'),
        ];

        if ($feedback->improvement_suggestions) {
            $lines[] = "---------------------------";
            $lines[] = "<b>💡 Suggestions:</b>\n<i>" . $feedback->improvement_suggestions . "</i>";
        }

        if (!empty($feedback->issues)) {
            $lines[] = "---------------------------";
            $lines[] = "<b>⚠️ Reported Issues:</b>\n• " . implode("\n• ", (array)$feedback->issues);
        }

        $lines[] = "---------------------------";
        return implode("\n", $lines);
    }

    private function formatJobCardRating($rating): string
    {
        $serviceStars = str_repeat('⭐', (int)$rating->service_rating);
        $techStars = str_repeat('⭐', (int)$rating->technical_rating);

        return implode("\n", [
            "<b>⭐ NEW JOB CARD RATING</b>",
            "---------------------------",
            "<b>Job No:</b> <code>" . ($rating->jobCard?->job_no ?? 'N/A') . "</code>",
            "<b>Customer:</b> " . ($rating->customer?->name ?? 'N/A'),
            "<b>Branch:</b> " . ($rating->jobCard?->branch?->name ?? 'N/A'),
            "---------------------------",
            "<b>Service Quality:</b> {$serviceStars}",
            "<b>Technical Skill:</b> {$techStars}",
            "---------------------------",
            "<b>Comment:</b>",
            "<i>" . ($rating->comment ?: 'No comments provided.') . "</i>",
            "---------------------------",
        ]);
    }

    private function formatBookingMessage($booking, bool $forCustomer = false): string
    {
        $vehicle = 'N/A';
        if ($booking->vehicle) {
            $vehicle = "{$booking->vehicle->plate_number} (" . ($booking->vehicle->brand?->name ?? '') . " " . ($booking->vehicle->model?->name ?? '') . ")";
        } elseif ($booking->new_vehicle_info) {
            $info = $booking->new_vehicle_info;
            $vehicle = ($forCustomer ? "" : "<b>[NEW] </b>") . ($info['plate_number'] ?? $info['vin_last_4'] ?? 'Unknown') . " (" . ($info['brand_name'] ?? '') . " " . ($info['model_name'] ?? '') . ")";
        }

        if ($forCustomer) {
            $phone = $booking->branch?->phone ?? '';
            $clickablePhone = $phone ? "<a href=\"tel:{$phone}\">{$phone}</a>" : 'Contact us';

            return implode("\n", array_filter([
                "<b>🙏 សូមអរគុណសម្រាប់ការកក់ទុក (Booking Received)</b>",
                "",
                "សួស្តី <b>" . ($booking->customer?->name ?? 'អតិថិជន') . "</b>,",
                "យើងខ្ញុំបានទទួលសំណើកក់របស់លោកអ្នករួចរាល់ហើយ។",
                "",
                "<b>ព័ត៌មានលម្អិត (Booking Details):</b>",
                "• <b>លេខកូដ (Ref):</b> <code>{$booking->booking_number}</code>",
                "• <b>សេវាកម្ម (Service):</b> " . ($booking->service?->name ?? 'ពិនិត្យទូទៅ'),
                "• <b>រថយន្ត (Vehicle):</b> {$vehicle}",
                "• <b>សាខា (Branch):</b> " . ($booking->branch?->name ?? 'N/A'),
                "",
                "<b>កាលវិភាគ (Schedule):</b>",
                "📅 <b>" . $booking->booking_date->format('d M Y') . "</b>",
                "⏰ <b>" . Carbon::parse($booking->booking_time)->format('h:i A') . "</b>",
                "",
                "<i>*ក្រុមការងារយើងខ្ញុំនឹងទាក់ទងទៅលោកអ្នកដើម្បីបញ្ជាក់ម្តងទៀតក្នុងពេលឆាប់ៗនេះ។</i>",
                "---------------------------",
                "📞 " . $clickablePhone,
            ]));
        }

        // Internal Team Format
        return implode("\n", [
            "<b>📅 NEW SERVICE BOOKING</b>",
            "---------------------------",
            "<b>Ref:</b> <code>{$booking->booking_number}</code>",
            "<b>Customer:</b> " . ($booking->customer?->name ?? 'N/A'),
            "<b>Phone:</b> <code>" . ($booking->customer?->phone ?? 'N/A') . "</code>",
            "<b>Vehicle:</b> {$vehicle}",
            "<b>Branch:</b> " . ($booking->branch?->name ?? 'N/A'),
            "<b>Service:</b> " . ($booking->service?->name ?? 'N/A'),
            "---------------------------",
            "<b>Schedule:</b>",
            "📅 " . $booking->booking_date->format('d-M-Y'),
            "⏰ " . \Carbon\Carbon::parse($booking->booking_time)->format('h:i A'),
            "---------------------------",
            "<b>Customer Notes:</b>",
            "<i>" . ($booking->notes ?: 'No special requests.') . "</i>",
            "---------------------------",
        ]);
    }

    private function formatBookingStatusUpdate($booking, bool $forCustomer = false): string
    {
        $statusUpper = strtoupper($booking->status);
        $statusEmoji = match($statusUpper) {
            'CONFIRMED'  => '✅',
            'CANCELLED'  => '❌',
            'REJECTED'   => '🚫',
            'RESCHEDULED' => '🕒',
            'COMPLETED'  => '🏁',
            default      => '📅'
        };

        $vehicle = 'N/A';
        if ($booking->vehicle) {
            $vehicle = "{$booking->vehicle->plate_number} (" . ($booking->vehicle->brand?->name ?? '') . " " . ($booking->vehicle->model?->name ?? '') . ")";
        } elseif ($booking->new_vehicle_info) {
            $info = $booking->new_vehicle_info;
            $vehicle = ($info['plate_number'] ?? 'Unknown') . " (" . ($info['brand_name'] ?? '') . " " . ($info['model_name'] ?? '') . ")";
        }

        if ($forCustomer) {
            $khStatus = match($statusUpper) {
                'CONFIRMED'   => 'ត្រូវបានបញ្ជាក់ (Confirmed)',
                'CANCELLED'   => 'ត្រូវបានលុបចោល (Cancelled)',
                'RESCHEDULED' => 'ត្រូវបានប្តូរកាលវិភាគ (Rescheduled)',
                'COMPLETED'   => 'បានបញ្ចប់រួចរាល់ (Completed)',
                default       => $statusUpper
            };

            $phone = $booking->branch?->phone ?? '';
            $clickablePhone = $phone ? "<a href=\"tel:{$phone}\">{$phone}</a>" : 'N/A';

            return implode("\n", array_filter([
                "{$statusEmoji} <b>បច្ចុប្បន្នភាពនៃការកក់ (Booking Update)</b>",
                "",
                "សួស្តីបង <b>" . ($booking->customer?->name ?? 'អតិថិជន') . "</b>,",
                "ស្ថានភាពនៃការកក់លេខ <code>{$booking->booking_number}</code> របស់បង៖",
                "👉 <b>{$khStatus}</b>",
                "",
                "<b>កាលវិភាគ (Schedule):</b>",
                "📅 <b>" . $booking->booking_date->format('d M Y') . "</b>",
                "⏰ <b>" . Carbon::parse($booking->booking_time)->format('h:i A') . "</b>",
                "📍 <b>" . ($booking->branch?->name ?? 'N/A') . "</b>",
                "",
                $booking->internal_notes ? "<b>សារពីក្រុមការងារ (Message):</b>" : null,
                $booking->internal_notes ? "<i>" . $booking->internal_notes . "</i>" : null,
                $booking->internal_notes ? "" : null,
                "សូមអរគុណ!",
                "---------------------------",
                "📞 " . $clickablePhone,
            ]));
        }

        // Internal Team Format
        return implode("\n", [
            "{$statusEmoji} <b>BOOKING STATUS UPDATE</b>",
            "---------------------------",
            "<b>Status:</b> " . strtoupper($booking->status),
            "<b>Ref:</b> <code>{$booking->booking_number}</code>",
            "<b>Customer:</b> " . ($booking->customer?->name ?? 'N/A'),
            "<b>Phone:</b> <code>" . ($booking->customer?->phone ?? 'N/A') . "</code>",
            "<b>Vehicle:</b> {$vehicle}",
            "---------------------------",
            "<b>Current Schedule:</b>",
            "📅 " . $booking->booking_date->format('d-M-Y'),
            "⏰ " . Carbon::parse($booking->booking_time)->format('h:i A'),
            "---------------------------",
            "<b>Internal Message:</b>",
            "<i>" . ($booking->internal_notes ?: 'Status updated.') . "</i>",
            "---------------------------",
        ]);
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
            // 1. Verify Token
            $response = Http::get("https://api.telegram.org/bot{$botToken}/getMe");
            if (!$response->successful()) {
                return ['success' => false, 'message' => $response->json('description') ?? 'Invalid Bot Token'];
            }

            $bot = $response->json('result');
            $message = "Connected as @{$bot['username']} (" . ($setting?->is_active ? 'Active' : 'Disabled') . ")";

            // 2. Attempt to send test message if global_chat_id exists
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
                    true // forceSend to bypass is_active check
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
            // Strip HTML tags for Telegram but keep basic formatting if needed
            // Telegram supports <b>, <i>, <u>, <s>, <code>, <pre>, <a>
            $content = strip_tags($announcement->content, '<b><i><u><s><code><pre><a>');
            $lines[] = $content;
        }

        return implode("\n", $lines);
    }

    /**
     * Sync user profile photo from Telegram to CRM Customer.
     */
    public function syncUserProfilePhoto($customer): bool
    {
        if (!$customer || empty($customer->telegram_user_id)) return false;
        if (!$this->botToken) return false;

        try {
            // 1. Get Photos
            $response = Http::get("https://api.telegram.org/bot{$this->botToken}/getUserProfilePhotos", [
                'user_id' => $customer->telegram_user_id,
                'limit' => 1
            ]);

            if (!$response->successful() || empty($response->json('result.photos'))) {
                return false;
            }

            // Get the largest version of the first photo
            $photos = $response->json('result.photos')[0];
            $fileId = end($photos)['file_id'];

            // 2. Get File Path
            $fileResponse = Http::get("https://api.telegram.org/bot{$this->botToken}/getFile", [
                'file_id' => $fileId
            ]);

            if (!$fileResponse->successful() || !$fileResponse->json('result.file_path')) {
                return false;
            }

            $filePath = $fileResponse->json('result.file_path');
            $downloadUrl = "https://api.telegram.org/file/bot{$this->botToken}/{$filePath}";

            // 3. Download and Save
            $imgRes = Http::get($downloadUrl);
            if (!$imgRes->successful()) return false;
            
            $imageContent = $imgRes->body();
            if (!$imageContent) return false;

            $extension = pathinfo($filePath, PATHINFO_EXTENSION) ?: 'jpg';
            $storagePath = "customers/tg_{$customer->id}_" . time() . ".{$extension}";
            
            \Illuminate\Support\Facades\Storage::disk('public')->put($storagePath, $imageContent);

            // Update customer record
            $customer->update(['image' => $storagePath]);

            return true;
        } catch (\Exception $e) {
            Log::error("TelegramService::syncUserProfilePhoto failed: " . $e->getMessage());
            return false;
        }
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
