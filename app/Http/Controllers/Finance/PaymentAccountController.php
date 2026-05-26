<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\PaymentAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\ImageService;

class PaymentAccountController extends Controller
{
    public function index(Request $request)
    {
        if ($request->boolean('compact')) {
            $query = PaymentAccount::select('id', 'name', 'account_no');

            if ($request->has('branch_id')) {
                $branchId = $request->branch_id;
                if (is_array($branchId)) {
                    $query->whereIn('branch_id', $branchId);
                } else {
                    $query->where('branch_id', $branchId);
                }
            }

            if ($request->has('status')) {
                $query->where('is_active', $request->status === 'active');
            }

            return response()->json($query->get());
        }

        $query = PaymentAccount::with('branch');

        if ($request->has('branch_id')) {
            $branchId = $request->branch_id;
            if (is_array($branchId)) {
                $query->whereIn('branch_id', $branchId);
            } else {
                $query->where('branch_id', $branchId);
            }
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->has('all')) {
            return $query->get();
        }

        return $query->paginate($request->input('per_page', 10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'account_no' => 'nullable|string|max:255',
            'branch_id' => 'nullable|exists:branches,id',
            'balance' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        $imageService = new ImageService();
        if ($request->hasFile('logo')) {
            $path = $imageService->compressToWebp($request->file('logo'));
            if ($path) {
                $validated['logo'] = $path;
            }
        } elseif ($request->logo) {
            $path = str_replace(Storage::disk('public')->url(''), '', $request->logo);
            $path = ltrim($path, '/');
            $validated['logo'] = $path;
        }

        $account = PaymentAccount::create($validated);

        return response()->json($account, 201);
    }

    public function show($id)
    {
        $paymentAccount = PaymentAccount::where('ulid', $id)->orWhere('id', $id)->firstOrFail();
        return $paymentAccount->load('branch');
    }

    public function update(Request $request, $id)
    {
        $paymentAccount = PaymentAccount::where('ulid', $id)->orWhere('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'account_no' => 'nullable|string|max:255',
            'branch_id' => 'sometimes|nullable|exists:branches,id',
            'balance' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('logo')) {
            if ($paymentAccount->logo) {
               Storage::disk('public')->delete($paymentAccount->logo);
            }
            $validated['logo'] = $request->file('logo')->store('payment_accounts', 'public');
        }

        $paymentAccount->update($validated);

        return response()->json($paymentAccount);
    }

    public function destroy($id)
    {
        $paymentAccount = PaymentAccount::where('ulid', $id)->orWhere('id', $id)->firstOrFail();
        $paymentAccount->delete();

        return response()->json(null, 204);
    }
}
