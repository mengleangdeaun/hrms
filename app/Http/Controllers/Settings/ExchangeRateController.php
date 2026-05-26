<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\System\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateController extends Controller
{
    /**
     * Get exchange rate settings.
     */
    public function getSettings(Request $request)
    {
        if ($request->boolean('compact')) {
            return response()->json([
                'exchange_rate_current_value' => SystemSetting::get('exchange_rate_current_value', 4100),
            ]);
        }

        return response()->json([
            'exchange_rate_mode' => SystemSetting::get('exchange_rate_mode', 'manual'),
            'exchange_rate_manual_value' => SystemSetting::get('exchange_rate_manual_value', 4100),
            'exchange_rate_provider_url' => SystemSetting::get('exchange_rate_provider_url', 'https://www.nbc.gov.kh/api/exRate.php'),
            'exchange_rate_provider_type' => SystemSetting::get('exchange_rate_provider_type', 'xml'),
            'exchange_rate_api_key' => SystemSetting::get('exchange_rate_api_key', ''),
            'exchange_rate_data_path' => SystemSetting::get('exchange_rate_data_path', 'average'), // Path to extract value
            'exchange_rate_last_sync' => SystemSetting::get('exchange_rate_last_sync', null),
            'exchange_rate_current_value' => SystemSetting::get('exchange_rate_current_value', 4100),
        ]);
    }

    /**
     * Save exchange rate settings.
     */
    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'exchange_rate_mode' => 'required|in:manual,auto',
            'exchange_rate_manual_value' => 'required|numeric',
            'exchange_rate_provider_url' => 'nullable|url',
            'exchange_rate_provider_type' => 'required|in:xml,json',
            'exchange_rate_api_key' => 'nullable|string',
            'exchange_rate_data_path' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value, is_numeric($value) ? 'float' : 'string');
        }

        // If mode is manual, update the current value immediately
        if ($validated['exchange_rate_mode'] === 'manual') {
            SystemSetting::set('exchange_rate_current_value', $validated['exchange_rate_manual_value'], 'float');
        }

        return response()->json(['message' => 'Settings saved successfully']);
    }

    /**
     * Fetch live rate from provider.
     */
    public function getLiveRate()
    {
        $url = SystemSetting::get('exchange_rate_provider_url', 'https://www.nbc.gov.kh/api/exRate.php');
        $type = SystemSetting::get('exchange_rate_provider_type', 'xml');
        $apiKey = SystemSetting::get('exchange_rate_api_key', '');
        $path = SystemSetting::get('exchange_rate_data_path', 'average');

        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->get($url, [
                'api_key' => $apiKey // Some APIs might use this
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to fetch from provider (Status: ' . $response->status() . ')');
            }

            $rate = null;
            $body = $response->body();

            if ($type === 'xml') {
                $trimmedBody = trim($body);
                if (empty($trimmedBody) || strpos($trimmedBody, '<') !== 0) {
                    // Check if it's the specific NBC error message
                    if (strpos($body, 'Connection to host is failed') !== false) {
                        throw new \Exception('NBC API service is currently down (Connection failed).');
                    }
                    throw new \Exception('Invalid XML response from provider. The service might be returning an error page.');
                }

                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($trimmedBody);
                if ($xml === false) {
                    $errors = libxml_get_errors();
                    libxml_clear_errors();
                    $msg = count($errors) > 0 ? $errors[0]->message : 'Failed to parse XML';
                    throw new \Exception('XML Error: ' . trim($msg));
                }

                // Logic for NBC specifically if using defaults
                if ($url === 'https://www.nbc.gov.kh/api/exRate.php' || $path === 'average') {
                    foreach ($xml->ex as $ex) {
                        if ((string)$ex->key === 'USD/KHR') {
                            $rate = (float)$ex->average;
                            break;
                        }
                    }
                } else {
                    // Generic path resolution for XML could be complex, 
                    // for now we support NBC-style or direct node access
                    $rate = (float)$xml->{$path};
                }
            } else {
                $data = $response->json();
                if ($data === null) {
                    throw new \Exception('Invalid JSON response from provider.');
                }
                // Simple dot notation for JSON path
                $rate = $this->getNestedValue($data, $path);
            }

            if ($rate === null) {
                throw new \Exception('Could not extract rate from response');
            }

            return response()->json([
                'rate' => $rate,
                'timestamp' => now()->toDateTimeString()
            ]);

        } catch (\Exception $e) {
            Log::error('Exchange Rate Fetch Error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync system rate with live provider immediately.
     */
    public function syncLiveRate()
    {
        $response = $this->getLiveRate();
        $data = $response->getData(true);

        if (isset($data['error'])) {
            return $response;
        }

        $rate = $data['rate'];
        SystemSetting::set('exchange_rate_current_value', $rate, 'float');
        SystemSetting::set('exchange_rate_last_sync', now()->toDateTimeString(), 'string');

        return response()->json([
            'message' => 'System rate synchronized successfully',
            'rate' => $rate,
            'timestamp' => now()->toDateTimeString()
        ]);
    }

    /**
     * Helper to get nested value from array using dot notation.
     */
    private function getNestedValue($array, $path)
    {
        if (!$path) return null;
        
        foreach (explode('.', $path) as $segment) {
            if (is_array($array) && array_key_exists($segment, $array)) {
                $array = $array[$segment];
            } else {
                return null;
            }
        }

        return $array;
    }
}
