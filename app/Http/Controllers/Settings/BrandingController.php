<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\System\SystemSetting;
use App\Models\HR\Branch;
use App\Models\Finance\PaymentAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BrandingController extends Controller
{
    /**
     * Get global branding settings.
     */
    public function getGlobal()
    {
        $keys = [
            'company_name',
            'company_logo',
            'company_address',
            'company_phone',
            'company_email',
            'company_website',
            'company_tin',
            'company_bank_details',
            'company_footer_text',
            'default_payment_account_id'
        ];

        $settings = [];
        foreach ($keys as $key) {
            $settings[$key] = SystemSetting::get($key);
        }

        return response()->json($settings);
    }

    /**
     * Update global branding settings.
     */
    public function updateGlobal(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string',
            'company_logo' => 'nullable', // File, URL, or Path
            'company_address' => 'nullable|string',
            'company_phone' => 'nullable|string',
            'company_email' => 'nullable|email',
            'company_website' => 'nullable|string',
            'company_tin' => 'nullable|string',
            'company_bank_details' => 'nullable|string',
            'company_footer_text' => 'nullable|string',
            'default_payment_account_id' => 'nullable|integer|exists:payment_accounts,id',
        ]);

        if ($request->hasFile('company_logo')) {
            // Delete old file if it exists and is local
            $oldPath = SystemSetting::get('company_logo');
            $this->deleteOldFile($oldPath);

            $file = $request->file('company_logo');
            $path = $file->store('branding', 'public');
            $validated['company_logo'] = Storage::disk('public')->url($path);
        }

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value);
        }

        return response()->json(['message' => 'Global branding updated successfully']);
    }

    /**
     * Get branches with branding overrides.
     */
    public function getBranches()
    {
        $branches = Branch::select('id', 'name', 'code', 'logo_url', 'footer_text', 'payment_account_id')
            ->with(['paymentAccount:id,name,account_no'])
            ->get();

        return response()->json($branches);
    }

    /**
     * Update branch branding overrides.
     */
    public function updateBranch(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'logo_url' => 'nullable', // File, URL, or Path
            'footer_text' => 'nullable|string',
            'payment_account_id' => 'nullable|integer|exists:payment_accounts,id',
        ]);

        if ($request->hasFile('logo_url')) {
            // Delete old file
            $this->deleteOldFile($branch->logo_url);

            $file = $request->file('logo_url');
            $path = $file->store('branding', 'public');
            $validated['logo_url'] = Storage::disk('public')->url($path);
        }

        $branch->update($validated);

        return response()->json([
            'message' => 'Branch branding updated successfully',
            'branch' => $branch->load('paymentAccount:id,name,account_no')
        ]);
    }

    /**
     * Helper to delete local storage files.
     */
    private function deleteOldFile($url)
    {
        if (!$url) return;

        // Extract relative path from URL if it points to our storage
        // Assuming app_url/storage/branding/...
        $storagePath = 'storage/';
        if (strpos($url, $storagePath) !== false) {
            $relativePath = substr($url, strpos($url, $storagePath) + strlen($storagePath));
            if (Storage::disk('public')->exists($relativePath)) {
                Storage::disk('public')->delete($relativePath);
            }
        }
    }

    /**
     * Get all payment accounts for select dropdowns.
     */
    public function getPaymentAccounts()
    {
        $accounts = PaymentAccount::where('is_active', true)
            ->select('id', 'name', 'account_no', 'branch_id')
            ->get();

        return response()->json($accounts);
    }
}
