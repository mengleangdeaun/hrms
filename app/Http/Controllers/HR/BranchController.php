<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Branch;
use Illuminate\Http\Request;

use App\Http\Resources\HR\BranchResource;

class BranchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return response()->json(
                Branch::select('id', 'name')
                    ->latest()
                    ->get()
                    ->makeHidden(['telegram_chat_id', 'telegram_topic_id'])
            );
        }
        $branches = Branch::with('telegramSetting')->latest()->get();
        return BranchResource::collection($branches);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:branches',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'zip_code' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'status' => 'required|string|in:active,inactive',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'allowed_radius' => 'nullable|numeric|min:0',
            'telegram_chat_id' => 'nullable|string|max:255',
            'telegram_topic_id' => 'nullable|string|max:255',
        ]);

        $branch = Branch::create($validated);

        // Sync with centralized Telegram settings
        $branch->telegramSetting()->updateOrCreate(
            ['branch_id' => $branch->id],
            [
                'global_chat_id'  => $validated['telegram_chat_id'] ?? null,
                'global_topic_id' => $validated['telegram_topic_id'] ?? null,
                'is_active'       => true,
            ]
        );

        return (new BranchResource($branch->load('telegramSetting')))->response()->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Branch $branch)
    {
        return new BranchResource($branch->load('telegramSetting'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:branches,code,' . $branch->id,
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'required|string|max:255',
            'zip_code' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'status' => 'required|string|in:active,inactive',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'allowed_radius' => 'nullable|numeric|min:0',
            'telegram_chat_id' => 'nullable|string|max:255',
            'telegram_topic_id' => 'nullable|string|max:255',
        ]);

        $branch->update($validated);

        // Sync with centralized Telegram settings
        $branch->telegramSetting()->updateOrCreate(
            ['branch_id' => $branch->id],
            [
                'global_chat_id'  => $validated['telegram_chat_id'] ?? null,
                'global_topic_id' => $validated['telegram_topic_id'] ?? null,
                'is_active'       => true,
            ]
        );

        return new BranchResource($branch->load('telegramSetting'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Branch $branch)
    {
        $branch->delete();
        return response()->json(null, 204);
    }
}

