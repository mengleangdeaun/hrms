<?php

namespace App\Http\Controllers\Api\Tma;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CRM\Customer;
use App\Models\CRM\Banner;
use App\Models\Workshop\JobCard;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Jobs\ProcessSystemActivityLog;
use App\Models\CRM\Booking;
use App\Models\CRM\CustomerVehicle;
use App\Models\Vehicle\VehicleBrand;
use App\Models\Vehicle\VehicleModel;
use App\Models\HR\Branch;
use App\Models\Workshop\Service;
use App\Models\Inventory\Product;
use App\Http\Resources\CRM\CustomerResource;

class TmaPortalController extends Controller
{
    private const THEME_PRESETS = [
        [
            'id' => 'default',
            'label' => 'S-COOL Pro',
            'primary' => '#111827',
            'secondary' => '#F59E0B',
            'background' => '#F8FAFC',
            'dark_background' => '#000000',
            'font' => 'Google Sans'
        ],
        [
            'id' => 'cny',
            'label' => 'Prosperity Red',
            'primary' => '#B22222',
            'secondary' => '#D4AF37',
            'background' => '#FFF9F9',
            'dark_background' => '#1A0505',
            'font' => 'Kantumruy Pro'
        ],
        [
            'id' => 'khmer-ny',
            'label' => 'Tropical Amber',
            'primary' => '#FFB800',
            'secondary' => '#F97316',
            'background' => '#FFFBEB',
            'dark_background' => '#1A1405',
            'font' => 'Dangrek'
        ],
        [
            'id' => 'christmas',
            'label' => 'Winter Spirit',
            'primary' => '#064E3B',
            'secondary' => '#991B1B',
            'background' => '#F0FDF4',
            'dark_background' => '#022c22',
            'font' => 'Montserrat'
        ],
        [
            'id' => 'womens-day',
            'label' => 'Royal Purple',
            'primary' => '#6D28D9',
            'secondary' => '#BE185D',
            'background' => '#F5F3FF',
            'dark_background' => '#1e152e',
            'font' => 'Poppins'
        ],
        [
            'id' => 'ocean',
            'label' => 'Ocean Breeze',
            'primary' => '#0369A1',
            'secondary' => '#0891B2',
            'background' => '#F0F9FF',
            'dark_background' => '#0c4a6e',
            'font' => 'Inter'
        ],
    ];

    /**
     * Authenticate and return customer status.
     */
    public function auth(Request $request)
    {
        $initData = $request->input('initData');

        if (!$initData) {
            return response()->json(['error' => 'Missing initialization data'], 400);
        }

        if (!$this->verifyTelegramInitData($initData)) {
            $token = \App\Services\TelegramService::getBotToken();
            $error = $token ? 'Invalid Telegram session' : 'Telegram Bot is not configured on server';
            return response()->json(['error' => $error], 403);
        }

        $data = $this->parseTelegramInitData($initData);
        $telegramId = $data['id'] ?? null;

        if (!$telegramId) {
            return response()->json(['error' => 'Could not determine Telegram ID'], 400);
        }

        $customer = Customer::where('telegram_user_id', $telegramId)->first();

        if ($customer) {
            $token = $customer->createToken('tma-token')->plainTextToken;
            return response()->json([
                'status' => 'linked',
                'token' => $token,
                'customer' => new CustomerResource($customer)
            ]);
        }

        return response()->json([
            'status' => 'not_linked',
            'telegram_id' => $telegramId
        ]);
    }

    /**
     * Link Telegram contact to a CRM Customer.
     */
    public function linkContact(Request $request)
    {
        $initData = $request->input('initData');
        $contact = $request->input('contact'); // Verified contact object from requestContact()

        // Debugging the incoming contact payload
        Log::info('TMA Link Contact Request', [
            'contact' => $contact,
            'has_init_data' => !!$initData
        ]);

        if (!$initData || !$contact) {
            return response()->json(['error' => 'Missing verified contact data. Please use the "Share Contact" button.'], 400);
        }

        if (!isset($contact['phone_number'])) {
            return response()->json(['error' => 'Phone number missing from verified contact. Please try sharing again.'], 400);
        }

        if (!$this->verifyTelegramInitData($initData)) {
            return response()->json(['error' => 'Invalid data signature'], 403);
        }

        $telegramUser = $this->getTelegramUser($initData);
        if (!$telegramUser) {
            return response()->json(['error' => 'Invalid user data'], 400);
        }

        $telegramId = $telegramUser['id'];

        // SECURITY VULNERABILITY FIX:
        // Ensure the shared contact actually belongs to the authenticated Telegram user.
        // Telegram returns 'user_id' in the contact object when a user shares their own contact.
        if (!isset($contact['user_id']) || $contact['user_id'] != $telegramId) {
            return response()->json([
                'error' => 'Security Error: You can only link the phone number registered to your own Telegram account.'
            ], 403);
        }

        $phone = $contact['phone_number'];
        $normalizedPhone = preg_replace('/^\+855/', '0', $phone);
        $normalizedPhone = preg_replace('/^855/', '0', $normalizedPhone);
        $normalizedPhone = preg_replace('/^\+/', '', $normalizedPhone); // Remove any leading + 

        if (!str_starts_with($normalizedPhone, '0') && strlen($normalizedPhone) > 5) {
            $normalizedPhone = '0' . $normalizedPhone;
        }

        $customer = Customer::where('phone', $normalizedPhone)->first();

        if (!$customer) {
            return response()->json([
                'error' => 'No customer found with phone: ' . $normalizedPhone . '. Please contact support to register your number.'
            ], 404);
        }

        $customer->update(['telegram_user_id' => $telegramId]);

        // Sync Profile Photo via Telegram Bot API
        try {
            $telegram = new \App\Services\TelegramService();
            $telegram->syncUserProfilePhoto($customer);
        } catch (\Exception $e) {
            Log::error("TMA Link Contact: Profile photo sync failed: " . $e->getMessage());
        }

        $token = $customer->createToken('tma_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'customer' => new CustomerResource($customer->refresh()),
        ]);
    }

    /**
     * Fetch all dashboard data.
     */
    public function dashboard(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            if (!$user instanceof Customer) {
                return response()->json(['error' => 'Forbidden: This portal is only for registered customers.'], 403);
            }
            $customer = $user;

            return response()->json($this->getDashboardData($customer));
        } catch (\Exception $e) {
            Log::error('TMA Dashboard Error: ' . $e->getMessage());
            return response()->json(['error' => 'Internal Server Error'], 500);
        }
    }

    /**
     * Fetch detailed job card data.
     */
    public function jobDetail(Request $request, $id)
    {
        try {
            $user = $request->user();
            if (!$user)
                return response()->json(['error' => 'Unauthorized'], 401);

            if (!$user instanceof Customer) {
                return response()->json(['error' => 'Forbidden: This portal is only for registered customers.'], 403);
            }
            $customer = $user;

            $jobCard = JobCard::where('id', $id)
                ->where('customer_id', $customer->id)
                ->select([
                    'id',
                    'job_no',
                    'sales_order_id',
                    'branch_id',
                    'vehicle_id',
                    'damage_type_id',
                    'type',
                    'status',
                    'mileage_in',
                    'started_at',
                    'completed_at',
                    'notes',
                    'technician_lead_id',
                    'created_at'
                ])
                ->with([
                    'vehicle.brand',
                    'vehicle.model',
                    'items.service',
                    'items.part',
                    'items.technicians',
                    'materialUsage.product',
                    'materialUsage.jobCardItem.part',
                    'leadTechnician',
                    'rating',
                    'qcReport.qcPerson',
                    'branch',
                    'order',
                    'damageType'
                ])
                ->first();

            if (!$jobCard) {
                return response()->json(['error' => 'Job Card not found'], 404);
            }

            // Transform response to clean up unnecessary fields
            $response = [
                'id' => $jobCard->id,
                'job_no' => $jobCard->job_no,
                'type' => $jobCard->type,
                'status' => $jobCard->status,
                'mileage_in' => $jobCard->mileage_in,
                'started_at' => $jobCard->started_at,
                'completed_at' => $jobCard->completed_at,
                'notes' => $jobCard->notes,
                'created_at' => $jobCard->created_at,
                'damage_type' => $jobCard->damageType?->name,
                
                'branch' => $jobCard->branch ? [
                    'name' => $jobCard->branch->name,
                    'address' => $jobCard->branch->address,
                    'phone' => $jobCard->branch->phone,
                    'lat' => $jobCard->branch->lat,
                    'lng' => $jobCard->branch->lng,
                ] : null,

                'financials' => $jobCard->order ? [
                    'grand_total' => $jobCard->order->grand_total,
                    'grand_total_khr' => $jobCard->order->grand_total_khr,
                    'paid_amount' => $jobCard->order->paid_amount,
                    'balance_amount' => $jobCard->order->balance_amount,
                    'payment_status' => $jobCard->order->payment_status,
                ] : null,

                'vehicle' => $jobCard->vehicle ? [
                    'plate_number' => $jobCard->vehicle->plate_number,
                    'vin_last_4' => $jobCard->vehicle->vin_last_4,
                    'year' => $jobCard->vehicle->year,
                    'brand' => $jobCard->vehicle->brand ? [
                        'name' => $jobCard->vehicle->brand->name,
                        'image_url' => $jobCard->vehicle->brand->image_url,
                    ] : null,
                    'model' => $jobCard->vehicle->model ? [
                        'name' => $jobCard->vehicle->model->name,
                        'segment' => $jobCard->vehicle->model->segment,
                    ] : null,
                ] : null,

                'lead_technician' => $jobCard->leadTechnician ? [
                    'full_name' => $jobCard->leadTechnician->full_name,
                    'employee_id' => $jobCard->leadTechnician->employee_id,
                    'profile_image_url' => $jobCard->leadTechnician->profile_image_url,
                ] : null,

                'qc_inspector_name' => $jobCard->qc_inspector_name,
                'qc_inspector_id' => $jobCard->qc_inspector_id,
                'qc_inspector_avatar' => $jobCard->qc_inspector_avatar,

                'items' => $jobCard->items->map(fn($item) => [
                    'id' => $item->id,
                    'status' => $item->status,
                    'completion_percentage' => $item->completion_percentage,
                    'started_at' => $item->started_at,
                    'completed_at' => $item->completed_at,
                    'notes' => $item->notes,
                    'service' => $item->service ? [
                        'name' => $item->service->name,
                        'code' => $item->service->code,
                    ] : null,
                    'part' => $item->part ? [
                        'name' => $item->part->name,
                        'code' => $item->part->code,
                        'side' => $item->part->side,
                    ] : null,
                    'technicians' => $item->technicians->map(fn($tech) => [
                        'full_name' => $tech->full_name,
                        'profile_image_url' => $tech->profile_image_url,
                    ]),
                ]),

                'material_usage' => $jobCard->materialUsage->map(fn($usage) => [
                    'product_name' => $usage->product?->name,
                    'product_image' => $usage->product?->img_url,
                    'spent_qty' => $usage->spent_qty,
                    'unit' => $usage->unit,
                    'product' => $usage->product ? [
                        'name' => $usage->product->name,
                        'img_url' => $usage->product->img_url,
                        'warranty_duration' => $usage->product->warranty_duration,
                        'warranty_unit' => $usage->product->warranty_unit,
                    ] : null,
                    'job_card_item' => [
                        'part' => $usage->jobCardItem?->part ? [
                            'name' => $usage->jobCardItem->part->name,
                        ] : null
                    ]
                ]),

                'rating' => $jobCard->rating,
                'qc_report' => $jobCard->qcReport ? [
                    'status' => $jobCard->qcReport->status,
                    'inspector' => $jobCard->qcReport->qcPerson?->full_name,
                ] : null,
            ];

            return response()->json($response);
        } catch (\Throwable $e) {
            Log::error('TMA Job Detail Error: ' . $e->getMessage(), [
                'id' => $id,
                'customer_id' => $customer->id ?? null
            ]);
            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function history(Request $request)
    {
        $user = $request->user();
        if (!$user)
            return response()->json(['error' => 'Unauthorized'], 401);

        if (!$user instanceof Customer) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $customer = $user;

        $history = JobCard::where('customer_id', $customer->id)
            ->whereIn('status', ['Completed', 'Closed', 'completed', 'closed', 'Delivered', 'delivered'])
            ->with([
                'vehicle.brand', 
                'vehicle.model', 
                'rating',
                'items.service',
                'materialUsage.product',
                'materialUsage.jobCardItem.part'
            ])
            ->latest()
            ->get()
            ->map(fn($job) => [
                'id' => $job->id,
                'job_no' => $job->job_no,
                'vehicle_id' => $job->vehicle_id,
                'type' => $job->type,
                'status' => $job->status,
                'started_at' => $job->started_at,
                'completed_at' => $job->completed_at,
                'created_at' => $job->created_at,
                'vehicle_name' => ($job->vehicle?->brand?->name ?? '') . ' ' . ($job->vehicle?->model?->name ?? ''),
                'plate_number' => $job->vehicle?->plate_number,
                'rating' => $job->rating,
                'items' => $job->items->map(fn($item) => [
                    'service' => $item->service ? ['name' => $item->service->name] : null
                ]),
                'materialUsage' => $job->materialUsage->map(fn($usage) => [
                    'product' => $usage->product ? ['name' => $usage->product->name] : null,
                    'job_card_item' => [
                        'part' => $usage->jobCardItem?->part ? ['name' => $usage->jobCardItem->part->name] : null
                    ]
                ]),
            ]);

        return response()->json($history);
    }

    public function garage(Request $request)
    {
        $user = $request->user();
        if (!$user)
            return response()->json(['error' => 'Unauthorized'], 401);

        if (!$user instanceof Customer) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        $customer = $user;

        $vehicles = $customer->vehicles()->with(['brand', 'model'])->get()->map(fn($v) => [
            'id' => $v->id,
            'plate_number' => $v->plate_number,
            'vin_last_4' => $v->vin_last_4,
            'year' => $v->year,
            'brand' => $v->brand ? [
                'name' => $v->brand->name,
                'image_url' => $v->brand->image_url,
            ] : null,
            'model' => $v->model ? [
                'name' => $v->model->name,
            ] : null,
        ]);

        return response()->json($vehicles);
    }

    public function getSettings()
    {
        $branding = $this->getBrandingConfig();
        $careCenter = \App\Models\System\SystemSetting::get('tma_care_center_config', ['faqs' => [], 'topics' => []]);

        return response()->json([
            'branding' => $branding,
            'care_center' => $careCenter,
            'available_themes' => self::THEME_PRESETS
        ]);
    }

    public function updateSettings(Request $request)
    {
        $branding = $request->input('branding');
        if ($branding) {
            \App\Models\System\SystemSetting::set('tma_branding_config', $branding, 'json');
        }

        $careCenter = $request->input('care_center');
        if ($careCenter) {
            \App\Models\System\SystemSetting::set('tma_care_center_config', $careCenter, 'json');
        }

        return response()->json(['status' => 'success', 'message' => 'TMA Configuration updated successfully']);
    }

    public function updateProfileSettings(Request $request)
    {
        $user = $request->user();
        if (!$user instanceof Customer) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $customer = $user;

        $validated = $request->validate([
            'tma_notifications_enabled' => 'required|boolean',
        ]);

        $customer->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile settings updated',
            'customer' => new CustomerResource($customer)
        ]);
    }

    public function logout(Request $request)
    {
        $customer = $request->user();
        if ($customer instanceof Customer) {
            $customer->tokens()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'TMA Session Terminated'
        ]);
    }

    /**
     * Broadcast a message to all or filtered customers linked via Telegram.
     */
    public function broadcast(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'image_url' => 'nullable|string',
            'aspect_ratio' => 'nullable|string',
            'customer_type_id' => 'nullable|exists:customer_types,id',
            'specific_customer_ids' => 'nullable|array',
            'specific_customer_ids.*' => 'exists:customers,id',
            'button_text' => 'nullable|string|max:50',
            'button_url' => 'nullable|url',
        ]);

        $message = $request->input('message');
        $imageUrl = $request->input('image_url');
        $aspectRatio = $request->input('aspect_ratio', 'landscape');
        $customerTypeId = $request->input('customer_type_id');
        $specificCustomerIds = $request->input('specific_customer_ids');
        $buttonText = $request->input('button_text');
        $buttonUrl = $request->input('button_url');

        $telegram = new \App\Services\TelegramService();
        if (!$telegram->botToken) {
            return response()->json([
                'status' => 'error',
                'message' => 'Telegram Bot is not configured.'
            ], 400);
        }

        $query = Customer::whereNotNull('telegram_user_id');
        if ($specificCustomerIds && is_array($specificCustomerIds)) {
            $query->whereIn('id', $specificCustomerIds);
        } elseif ($customerTypeId) {
            $query->where('customer_type_id', $customerTypeId);
        }

        $customers = $query->get();
        $totalRecipients = $customers->count();

        if ($totalRecipients > 0) {
            if ($imageUrl && str_starts_with($imageUrl, 'data:image')) {
                try {
                    $imageUrl = $this->saveBase64Image($imageUrl, 'broadcasts');
                } catch (\Exception $e) {
                    Log::error('TMA Broadcast Image Upload Error: ' . $e->getMessage());
                }
            }

            $broadcast = \App\Models\TmaBroadcast::create([
                'message' => $message,
                'image_url' => $imageUrl,
                'aspect_ratio' => $aspectRatio,
                'button_text' => $buttonText,
                'button_url' => $buttonUrl,
                'sender_id' => $request->user()->id,
                'total_recipients' => $totalRecipients,
                'status' => 'processing',
            ]);

            $broadcast->customers()->attach($customers->pluck('id'));

            $successCount = 0;
            $failCount = 0;
            $lastErrorMessage = null;

            // Clean and repair HTML once before the loop
            $formattedMessage = $this->repairHtmlForTelegram($message);

            // Prepare reply markup if button is provided
            $replyMarkup = null;
            if ($buttonText && $buttonUrl) {
                $replyMarkup = [
                    'inline_keyboard' => [
                        [
                            ['text' => $buttonText, 'url' => $buttonUrl]
                        ]
                    ]
                ];
            }

            foreach ($customers as $customer) {
                $sent = false;
                try {
                    if ($imageUrl) {
                        // Use asset() to ensure an absolute URL is generated.
                        // TelegramService will automatically try to intercept this for a local file upload.
                        $sent = $telegram->sendPhoto($customer->telegram_user_id, asset($imageUrl), $formattedMessage, null, true, $replyMarkup);
                    } else {
                        $sent = $telegram->sendMessage($customer->telegram_user_id, $formattedMessage, null, true, $replyMarkup);
                    }
                } catch (\Exception $e) {
                    $lastErrorMessage = $e->getMessage();
                    Log::error("TMA Broadcast failed for customer {$customer->id}: " . $e->getMessage());
                }

                if ($sent) {
                    $successCount++;
                } else {
                    $failCount++;
                    // Basic fallback to alert user if service returned false without exception
                    if (!$lastErrorMessage)
                        $lastErrorMessage = "Telegram API rejected the request. Check Bot Token or Chat permissions.";
                }
            }

            $broadcast->update([
                'status' => 'sent',
                'delivered_count' => $successCount,
                'failed_count' => $failCount,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Successfully broadcasted to {$totalRecipients} customers.",
            'total' => $totalRecipients,
            'delivered' => $successCount ?? 0,
            'failed' => $failCount ?? 0,
            'error_detail' => ($successCount === 0 && $totalRecipients > 0) ? ($lastErrorMessage ?? 'Unspecified error') : null
        ]);
    }

    public function markAsViewed(Request $request)
    {
        $customer = $request->user();
        if (!$customer instanceof Customer)
            return response()->json(['error' => 'Unauthorized'], 401);

        $unviewed = $customer->broadcasts()->wherePivot('is_viewed', false)->get();
        foreach ($unviewed as $broadcast) {
            $customer->broadcasts()->updateExistingPivot($broadcast->id, [
                'is_viewed' => true,
                'viewed_at' => now(),
            ]);
            $broadcast->increment('delivered_count');
        }
        return response()->json(['status' => 'success', 'marked' => $unviewed->count()]);
    }

    public function getBroadcasts(Request $request)
    {
        $search = $request->input('search');
        $showArchived = filter_var($request->input('archived'), FILTER_VALIDATE_BOOLEAN);
        $perPage = $request->input('per_page', 10);

        $query = \App\Models\TmaBroadcast::with('sender')
            ->where('is_archived', $showArchived);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                    ->orWhereHas('sender', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        return response()->json($query->latest()->paginate($perPage));
    }

    public function exportBroadcasts(Request $request)
    {
        $broadcasts = \App\Models\TmaBroadcast::with('sender')->latest()->get();
        $handle = fopen('php://temp', 'w');
        fputcsv($handle, ['ID', 'Date', 'Message', 'Sender', 'Recipients', 'Delivered', 'Failed', 'Clicks', 'Status']);
        foreach ($broadcasts as $b) {
            fputcsv($handle, [$b->id, $b->created_at->format('Y-m-d H:i'), substr($b->message, 0, 50), $b->sender?->name, $b->total_recipients, $b->delivered_count, $b->failed_count, $b->click_count, $b->status]);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        return response($csv)->header('Content-Type', 'text/csv')->header('Content-Disposition', 'attachment; filename="tma_broadcasts.csv"');
    }

    public function bulkDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids))
            return response()->json(['error' => 'No IDs provided'], 400);

        \App\Models\TmaBroadcast::whereIn('id', $ids)->delete();

        // System Log
        ProcessSystemActivityLog::dispatch([
            'log_name' => 'request',
            'description' => "Deleted " . count($ids) . " TMA Broadcast(s)",
            'event' => 'deleted',
            'causer_type' => get_class($request->user()),
            'causer_id' => $request->user()->id,
            'properties' => [
                'module' => 'crm',
                'ids' => $ids
            ],
        ]);

        return response()->json(['status' => 'success', 'message' => count($ids) . ' broadcasts deleted.']);
    }

    public function archive(Request $request)
    {
        $ids = $request->input('ids', []);
        $archive = filter_var($request->input('archive'), FILTER_VALIDATE_BOOLEAN);

        if (empty($ids))
            return response()->json(['error' => 'No IDs provided'], 400);

        \App\Models\TmaBroadcast::whereIn('id', $ids)->update(['is_archived' => $archive]);

        // System Log
        ProcessSystemActivityLog::dispatch([
            'log_name' => 'request',
            'description' => ($archive ? "Archived " : "Restored ") . count($ids) . " TMA Broadcast(s)",
            'event' => 'updated',
            'causer_type' => get_class($request->user()),
            'causer_id' => $request->user()->id,
            'properties' => [
                'module' => 'crm',
                'action' => $archive ? 'archive' : 'restore',
                'ids' => $ids
            ],
        ]);

        $message = $archive ? 'Archived ' : 'Unarchived ';
        return response()->json(['status' => 'success', 'message' => $message . count($ids) . ' broadcasts.']);
    }

    public function getCustomerTypes()
    {
        return response()->json(\App\Models\CRM\CustomerType::select('id', 'name')->get());
    }

    public function getLinkedCustomers(Request $request)
    {
        $search = $request->input('search');
        $query = Customer::whereNotNull('telegram_user_id');
        
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        
        return response()->json($query->limit(20)->get(['id', 'name', 'phone', 'image']));
    }

    private function parseTelegramInitData($initData)
    {
        parse_str($initData, $params);
        if (isset($params['user'])) {
            return json_decode($params['user'], true);
        }
        return $params;
    }

    /**
     * Clean and repair HTML for Telegram's strict HTML parse mode.
     * Keeps only allowed tags and ensures all tags are properly closed.
     */
    private function repairHtmlForTelegram($text)
    {
        if (empty($text))
            return '';

        // 1. Simplify and remove unsupported tags except the basic ones
        // Telegram supports: <b>, <strong>, <i>, <em>, <u>, <ins>, <s>, <strike>, <del>, <a>, <code>, <pre>, <blockquote>
        $allowedTags = '<b><strong><i><em><u><ins><s><strike><del><a><code><pre><blockquote>';

        // Remove <p> and replace with newlines
        $text = str_replace(['<p>', '</p>'], ["", "\n"], $text);
        // Remove <br> and replace with newline
        $text = str_replace(['<br>', '<br/>', '<br />'], "\n", $text);

        $text = strip_tags($text, $allowedTags);
        $text = trim($text);

        // 2. Use a simple stack-based tag repair for unclosed tags
        preg_match_all('/<(\/?[a-z1-6]+)([^>]*)>/i', $text, $matches, PREG_OFFSET_CAPTURE);
        $stack = [];

        foreach ($matches[1] as $index => $tagMatch) {
            $tag = strtolower($tagMatch[0]);
            $isClosing = $tag[0] === '/';
            $tagName = $isClosing ? substr($tag, 1) : $tag;

            if ($isClosing) {
                if (!empty($stack) && end($stack) === $tagName) {
                    array_pop($stack);
                } else {
                    // Invalid closing tag (doesn't match open)
                    // We'll just ignore it for now or we could try to remove it
                }
            } else {
                $stack[] = $tagName;
            }
        }

        // Add matching closing tags for any unclosed tags at the end
        while ($tagName = array_pop($stack)) {
            $text .= "</{$tagName}>";
        }

        return $text;
    }

    private function getTelegramUser($initData)
    {
        return $this->parseTelegramInitData($initData);
    }

    private function verifyTelegramInitData($initData)
    {
        parse_str($initData, $params);
        if (!isset($params['hash']))
            return false;
        $hash = $params['hash'];
        unset($params['hash']);
        ksort($params);
        $dataCheckString = '';
        foreach ($params as $key => $value)
            $dataCheckString .= "$key=$value\n";
        $dataCheckString = rtrim($dataCheckString, "\n");
        $setting = \App\Models\Communication\TelegramSetting::instance();
        $botToken = $setting?->bot_token ?? config('services.telegram.bot_token');
        if (!$botToken)
            return false;
        $secretKey = hash_hmac('sha256', $botToken, 'WebAppData', true);
        $calculatedHash = hash_hmac('sha256', $dataCheckString, $secretKey);
        return hash_equals($calculatedHash, $hash);
    }

    private function saveBase64Image($base64String, $directory)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            $data = base64_decode(substr($base64String, strpos($base64String, ',') + 1));
            $fileName = uniqid() . '.' . strtolower($type[1]);
            $path = $directory . '/' . $fileName;
            Storage::disk('public')->put($path, $data);
            return '/storage/' . $path;
        }
        throw new \Exception('Invalid image data');
    }

    private function getDashboardData(Customer $customer)
    {
        $branding = $this->getBrandingConfig();

        return [
            'customer' => new CustomerResource($customer),
            'branding' => $branding,
            'active_services' => JobCard::where('customer_id', $customer->id)
                ->whereNotIn('status', ['Completed', 'Closed', 'Cancelled', 'cancelled', 'completed', 'closed', 'Delivered', 'delivered'])
                ->with(['vehicle.brand', 'vehicle.model', 'items.service', 'materialUsage.product', 'materialUsage.jobCardItem.part'])
                ->latest()
                ->get()
                ->map(fn($job) => $this->formatTmaJobCard($job)),
            'unrated_jobs' => JobCard::where('customer_id', $customer->id)
                ->whereIn('status', ['Completed', 'Closed', 'completed', 'closed', 'Delivered', 'delivered'])
                ->whereDoesntHave('rating')
                ->with(['vehicle.brand', 'vehicle.model', 'items.service', 'materialUsage.product', 'materialUsage.jobCardItem.part'])
                ->latest()
                ->get()
                ->map(fn($job) => $this->formatTmaJobCard($job)),
            'history' => JobCard::where('customer_id', $customer->id)
                ->whereIn('status', ['Completed', 'Closed', 'completed', 'closed', 'Delivered', 'delivered'])
                ->with(['vehicle.brand', 'vehicle.model', 'rating', 'items.service', 'materialUsage.product', 'materialUsage.jobCardItem.part'])
                ->latest()
                ->limit(10)
                ->get()
                ->map(fn($job) => $this->formatTmaJobCard($job)),
            'vehicles' => $customer->vehicles()->with(['brand', 'model'])->get()->map(fn($v) => $this->formatTmaVehicle($v)),
            'banners' => Banner::active()->where('banner_type', 'Homepage')->orderBy('sort_order', 'asc')->select(['id', 'title', 'image_url', 'link_url'])->get(),
            'service_banners' => Banner::active()->where('banner_type', 'Category')->orderBy('sort_order', 'asc')->select(['id', 'title', 'image_url', 'link_url'])->get(),
            'popup_banners' => Banner::active()->where('banner_type', 'Popup')->orderBy('sort_order', 'asc')->select(['id', 'title', 'image_url', 'link_url'])->get(),
            'services' => Service::where('is_active', 1)->select(['id', 'name', 'code', 'base_price'])->get(),
            'products' => Product::where('is_active', 1)->where('show_in_tma', 1)->orderBy('sort_order', 'asc')->latest()->limit(20)->get()->map(fn($p) => $this->formatTmaProduct($p)),
            'care_center' => \App\Models\System\SystemSetting::get('tma_care_center_config', ['faqs' => [], 'topics' => []])
        ];
    }

    /**
     * Format a JobCard for the TMA Portal.
     */
    private function formatTmaJobCard($job)
    {
        return [
            'id' => $job->id,
            'job_no' => $job->job_no,
            'status' => $job->status,
            'started_at' => $job->started_at,
            'completed_at' => $job->completed_at,
            'created_at' => $job->created_at,
            'vehicle_id' => $job->vehicle_id,
            'vehicle' => $job->vehicle ? [
                'plate_number' => $job->vehicle->plate_number,
                'vin_last_4' => $job->vehicle->vin_last_4,
                'brand' => $job->vehicle->brand ? [
                    'name' => $job->vehicle->brand->name,
                    'image_url' => $job->vehicle->brand->image_url,
                ] : null,
                'model' => $job->vehicle->model ? [
                    'name' => $job->vehicle->model->name,
                ] : null,
            ] : null,
            'rating' => $job->relationLoaded('rating') ? $job->rating : null,
            'items' => $job->items->map(fn($item) => [
                'service' => $item->service ? ['name' => $item->service->name] : null
            ]),
            'materialUsage' => $job->materialUsage->map(fn($usage) => [
                'product' => $usage->product ? ['name' => $usage->product->name] : null,
                'job_card_item' => [
                    'part' => $usage->jobCardItem?->part ? ['name' => $usage->jobCardItem->part->name] : null
                ]
            ]),
        ];
    }

    /**
     * Format a Vehicle for the TMA Portal.
     */
    private function formatTmaVehicle($v)
    {
        return [
            'id' => $v->id,
            'plate_number' => $v->plate_number,
            'vin_last_4' => $v->vin_last_4,
            'year' => $v->year,
            'brand' => $v->brand ? [
                'name' => $v->brand->name,
                'image_url' => $v->brand->image_url,
            ] : null,
            'model' => $v->model ? [
                'name' => $v->model->name,
            ] : null,
        ];
    }

    /**
     * Format a Product for the TMA Portal.
     */
    private function formatTmaProduct($p)
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'code' => $p->code,
            'image_url' => $p->img_url,
            'price' => $p->price,
            'show_in_tma' => (bool)$p->show_in_tma,
            'tags' => $p->tags
        ];
    }

    /**
     * Get the merged branding configuration.
     */
    private function getBrandingConfig()
    {
        $defaults = $this->getDefaultBranding();
        $stored = \App\Models\System\SystemSetting::get('tma_branding_config', $defaults);

        if (is_string($stored)) {
            $stored = json_decode($stored, true);
        }

        // Clean up corruption
        if (is_array($stored)) {
            foreach ($stored as $key => $value) {
                if (is_numeric($key))
                    unset($stored[$key]);
            }
        }

        // Deep merge defaults with stored branding (except navigation)
        $navigation = $stored['navigation'] ?? [];
        unset($stored['navigation']);

        $merged = array_merge($defaults, is_array($stored) ? $stored : []);

        // Smart merge navigation by ID
        $merged['navigation'] = $this->mergeNavigation($defaults['navigation'], $navigation);

        return $merged;
    }

    /**
     * Merge navigation items by ID.
     */
    private function mergeNavigation(array $defaults, array $stored)
    {
        if (empty($stored)) {
            return $defaults;
        }

        $merged = [];
        $storedById = [];

        foreach ($stored as $item) {
            if (isset($item['id'])) {
                $storedById[$item['id']] = $item;
            }
        }

        // Always prioritize defaults to ensure new features appear,
        // but keep user-defined labels/icons/paths if they exist.
        foreach ($defaults as $defaultItem) {
            $id = $defaultItem['id'];
            if (isset($storedById[$id])) {
                // Merge default with stored (stored wins for labels/icons/paths)
                $merged[] = array_merge($defaultItem, $storedById[$id]);
                unset($storedById[$id]);
            } else {
                // New default item not yet in stored settings
                $merged[] = $defaultItem;
            }
        }

        // Append any remaining custom stored items that aren't in defaults
        foreach ($storedById as $customItem) {
            $merged[] = $customItem;
        }

        return $merged;
    }

    /**
     * Get default branding configuration.
     */
    private function getDefaultBranding()
    {
        return [
            'theme_id' => 'default',
            'appearance' => 'light',
            'primary_color' => '#0047FF',
            'secondary_color' => '#64748b',
            'bg_color' => '#F8FAFC',
            'dark_bg_color' => '#0f172a',
            'font_family' => 'Google Sans',
            'logo_url' => '/assets/images/logo_tma.png',
            'navigation' => [
                ['id' => 'home', 'label' => 'Home', 'icon' => 'IconLayoutDashboard', 'path' => '/crm/tma/home'],
                ['id' => 'booking', 'label' => 'Booking', 'icon' => 'IconCalendarStats', 'path' => '/crm/tma/booking'],
                ['id' => 'services', 'label' => 'Services', 'icon' => 'IconClipboardList', 'path' => '/crm/tma/services'],
                ['id' => 'history', 'label' => 'History', 'icon' => 'IconClock', 'path' => '/crm/tma/history'],
                ['id' => 'garage', 'label' => 'Garage', 'icon' => 'IconCar', 'path' => '/crm/tma/garage'],
            ],
            'home_sections' => [
                'hero_section' => true,
                'marketing_banners' => true,
                'active_tracker' => true,
                'services_preview' => true,
                'products_preview' => true,
                'garage_preview' => true,
                'care_center_section' => true,
                'history_preview' => true,
            ]
        ];
    }

    public function bookingMetadata(Request $request)
    {
        try {
            $user = $request->user();

            // 1. Optimize Branches (Only need display info)
            $branches = Branch::whereIn('status', ['Active', 'active'])
                ->select(['id', 'name', 'address', 'city'])
                ->get();

            // 2. Optimize Services (Only need display info)
            $services = Service::where('is_active', true)
                ->select(['id', 'name', 'base_price'])
                ->get();

            // 3. Optimize Brands & Models (Reduce payload size)
            $brands = VehicleBrand::where('is_active', true)
                ->select(['id', 'name', 'image'])
                ->get()
                ->map(function ($brand) {
                    return [
                        'id' => $brand->id,
                        'name' => $brand->name,
                        'image_url' => $brand->image_url // Use accessor for full URL
                    ];
                });

            $models = VehicleModel::select(['id', 'brand_id', 'name'])->get();

            // 4. Fetch Garage Vehicles
            // If it's a Customer, get their specific vehicles. 
            // If it's an Admin/Staff, let's show all vehicles for testing purposes so the UI isn't empty.
            $garageQuery = CustomerVehicle::with([
                'brand:id,name,image',
                'model:id,brand_id,name'
            ])->select(['id', 'customer_id', 'brand_id', 'model_id', 'plate_number', 'vin_last_4']);

            if ($user instanceof \App\Models\CRM\Customer) {
                $garage = $garageQuery->where('customer_id', $user->id)->get();
            } else {
                // For Admin/Staff testing: Show recent vehicles so the UI can be validated
                $garage = $garageQuery->latest()->limit(5)->get();
            }

            return response()->json([
                'branches' => $branches,
                'services' => $services,
                'brands' => $brands,
                'models' => $models,
                'garage' => $garage
            ]);

        } catch (\Exception $e) {
            Log::error('TMA Booking Metadata Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load booking details.'], 500);
        }
    }

    public function storeBooking(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'service_id' => 'nullable|exists:services,id',
            'customer_vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'new_vehicle_info' => 'nullable|array',
            'booking_date' => 'required|date|after_or_equal:today',
            'booking_time' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $customerId = null;

        if ($user instanceof Customer) {
            $customerId = $user->id;
        } else {
            return response()->json(['error' => 'Forbidden: Only customers can create bookings.'], 403);
        }

        $vehicleId = $validated['customer_vehicle_id'];

        // Handle New Vehicle Registration
        if (!$vehicleId && !empty($validated['new_vehicle_info'])) {
            $info = $validated['new_vehicle_info'];

            // Check if plate already exists for this customer or globally
            $vehicle = CustomerVehicle::where('plate_number', $info['plate_number'])->first();

            if (!$vehicle) {
                $vehicle = CustomerVehicle::create([
                    'customer_id' => $customerId,
                    'brand_id' => $info['brand_id'] ?? null,
                    'model_id' => $info['model_id'] ?? null,
                    'plate_number' => $info['plate_number'] ?? null,
                    'vin_last_4' => $info['vin_last_4'] ?? null,
                    'notes' => 'Auto-registered from TMA Booking',
                ]);
            }
            $vehicleId = $vehicle->id;
        }

        $bookingNumber = (new \App\Services\DocumentNumberService())->generate('service_booking', $validated['branch_id']);

        $booking = Booking::create([
            'booking_number' => $bookingNumber,
            'customer_id' => $customerId,
            'branch_id' => $validated['branch_id'],
            'service_id' => $validated['service_id'],
            'customer_vehicle_id' => $vehicleId,
            'new_vehicle_info' => $validated['new_vehicle_info'] ?? null,
            'booking_date' => $validated['booking_date'],
            'booking_time' => $validated['booking_time'],
            'notes' => $validated['notes'],
            'status' => 'Pending',
        ]);

        // Notify Telegram
        try {
            $booking->load(['customer', 'branch', 'service', 'vehicle.brand', 'vehicle.model']);
            (new \App\Services\TelegramService($booking->branch_id))->broadcast('crm.booking_created', $booking);
        } catch (\Exception $e) {
            Log::error('Booking Telegram Notification Failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Your booking has been received! We will contact you shortly to confirm.',
            'booking' => $booking
        ]);
    }

    public function getAllBookings(Request $request)
    {
        $query = Booking::with(['customer', 'branch', 'service', 'vehicle.brand', 'vehicle.model'])
            ->latest();

        // Filters
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }
        if ($request->date_from) {
            $query->whereDate('booking_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('booking_date', '<=', $request->date_to);
        }

        // Stats calculation
        $stats = [
            'total' => Booking::count(),
            'pending' => Booking::where('status', 'Pending')->count(),
            'confirmed' => Booking::where('status', 'Confirmed')->count(),
            'completed' => Booking::where('status', 'Completed')->count(),
            'cancelled' => Booking::whereIn('status', ['Cancelled', 'Rejected'])->count(),
        ];

        $paginated = $query->paginate($request->per_page ?? 20);
        $response = $paginated->toArray();
        $response['stats'] = $stats;

        return response()->json($response);
    }

    public function updateBookingStatus(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Pending,Confirmed,Cancelled,Rescheduled,Completed',
            'internal_notes' => 'nullable|string',
            'booking_date' => 'nullable|date',
            'booking_time' => 'nullable|string',
        ]);

        $oldStatus = $booking->status;
        $booking->update($validated);

        // Notify customer via Telegram if status changed or it's a reschedule
        if ($oldStatus !== $booking->status || $booking->status === 'Rescheduled') {
            try {
                $booking->load(['customer', 'branch', 'service', 'vehicle.brand', 'vehicle.model']);
                $telegram = new \App\Services\TelegramService($booking->branch_id);

                // 1. Notify the Branch Group (Internal)
                $telegram->broadcast('crm.booking_updated', $booking);

                // 2. Notify the Customer Directly (Private)
                if ($booking->customer) {
                    $telegram->notifyCustomer($booking->customer, 'crm.booking_updated', $booking);
                }
            } catch (\Exception $e) {
                Log::error('Booking Status Update Notification Failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Booking updated successfully.',
            'booking' => $booking->load(['customer', 'branch', 'service', 'vehicle.brand', 'vehicle.model'])
        ]);
    }

    public function exportBookings(Request $request)
    {
        $bookings = Booking::with(['customer', 'branch', 'service', 'vehicle'])
            ->latest()
            ->get();

        $filename = "bookings_export_" . now()->format('Ymd_His') . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $columns = ['ID', 'Date', 'Time', 'Customer', 'Phone', 'Vehicle', 'Branch', 'Service', 'Status', 'Notes'];

        $callback = function () use ($bookings, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($bookings as $booking) {
                fputcsv($file, [
                    $booking->id,
                    $booking->booking_date->format('Y-m-d'),
                    $booking->booking_time,
                    $booking->customer?->name,
                    $booking->customer?->phone,
                    $booking->vehicle?->plate_number,
                    $booking->branch?->name,
                    $booking->service?->name,
                    $booking->status,
                    $booking->notes
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function bookingHistory(Request $request)
    {
        $user = $request->user();
        if (!$user instanceof Customer) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        $customer = $user;

        $query = Booking::query();

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } else {
            // Staff can see all recent bookings or just a subset
            $query->latest()->limit(20);
        }

        return $query->with(['branch', 'service', 'vehicle.brand', 'vehicle.model'])
            ->latest()
            ->get()
            ->map(fn($booking) => [
                'id' => $booking->id,
                'booking_number' => $booking->booking_number,
                'booking_date' => $booking->booking_date,
                'booking_time' => $booking->booking_time,
                'status' => $booking->status,
                'notes' => $booking->notes,
                'internal_notes' => $booking->internal_notes,
                'branch' => $booking->branch ? ['name' => $booking->branch->name] : null,
                'service' => $booking->service ? ['name' => $booking->service->name] : null,
                'vehicle_name' => ($booking->vehicle?->brand?->name ?? '') . ' ' . ($booking->vehicle?->model?->name ?? ''),
                'plate_number' => $booking->vehicle?->plate_number,
                'created_at' => $booking->created_at,
            ]);
    }

    /**
     * Paginated list of services for TMA portal.
     */
    public function services(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');

        $query = Service::where('is_active', 1);

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $services = $query->latest()->paginate($perPage);

        return response()->json($services);
    }

    /**
     * Detailed service information.
     */
    public function serviceDetail(Request $request, $id)
    {
        $service = Service::where('is_active', 1)
            ->with(['materials' => function($q) {
                $q->whereHas('product', function($pq) {
                    $pq->where('show_in_tma', 1);
                })->with('product');
            }, 'category', 'tags'])
            ->find($id);

        if (!$service) {
            return response()->json(['error' => 'Service not found'], 404);
        }

        return response()->json($service);
    }

    /**
     * Paginated list of products for TMA portal.
     */
    public function products(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $tag = $request->input('tag');

        $query = Product::where('is_active', 1)->where('show_in_tma', 1);

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('brand', 'like', "%{$search}%");
            });
        }

        if ($tag) {
            $query->whereHas('tags', function($q) use ($tag) {
                $q->where('name', $tag);
            });
        }

        $products = $query->orderBy('sort_order', 'asc')->latest()->paginate($perPage);

        // Transform to match frontend expectations
        $products->getCollection()->transform(fn($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'code' => $p->code,
            'image_url' => $p->img_url,
            'price' => $p->price,
            'brand' => $p->brand,
            'show_in_tma' => (bool)$p->show_in_tma,
            'tags' => $p->tags
        ]);

        return response()->json($products);
    }

    /**
     * Detailed product information.
     */
    public function productDetail(Request $request, $id)
    {
        $product = Product::where('is_active', 1)
            ->where('show_in_tma', 1)
            ->with(['tags', 'category'])
            ->find($id);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        // Find related services that use this product
        $relatedServices = Service::whereHas('materials', function($q) use ($id) {
            $q->where('product_id', $id);
        })->where('is_active', 1)->get();

        return response()->json([
            'product' => $product,
            'related_services' => $relatedServices
        ]);
    }
}