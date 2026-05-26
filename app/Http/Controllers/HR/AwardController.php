<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\HR\Award;

class AwardController extends Controller
{
    public function index()
    {
        $awards = Award::with(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name'])->latest()->get();
        return response()->json($awards);
    }

    public function store(Request $request)
    {
        $rules = [
            'employee_id' => 'required|exists:employees,id',
            'award_type_id' => 'required|exists:award_types,id',
            'date' => 'required|date',
            'gift' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'certificate' => 'nullable',
            'photo' => 'nullable',
        ];

        $validated = $request->validate($rules);

        // Handle Certificate
        if ($request->hasFile('certificate')) {
            $validated['certificate'] = $request->file('certificate')->store('awards/certificates', 'public');
        } else {
            $validated['certificate'] = $this->resolvePath($request->certificate);
        }

        // Handle Photo
        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('awards/photos', 'public');
        } else {
            $validated['photo'] = $this->resolvePath($request->photo);
        }

        $award = Award::create($validated);
        $award->load(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name']);
        
        return response()->json($award, 201);
    }

    public function show(Award $award)
    {
        $award->load(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name']);
        return response()->json($award);
    }

    public function update(Request $request, Award $award)
    {
        $rules = [
            'employee_id' => 'required|exists:employees,id',
            'award_type_id' => 'required|exists:award_types,id',
            'date' => 'required|date',
            'gift' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'certificate' => 'nullable',
            'photo' => 'nullable',
        ];

        $validated = $request->validate($rules);

        // Handle Certificate
        if ($request->hasFile('certificate')) {
            // Delete old file if it exists and is internal
            if ($award->getRawOriginal('certificate') && !filter_var($award->getRawOriginal('certificate'), FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($award->getRawOriginal('certificate'));
            }
            $validated['certificate'] = $request->file('certificate')->store('awards/certificates', 'public');
        } elseif ($request->has('certificate')) {
            // allows clearing (if empty string sent) or keeping existing/URL
            $validated['certificate'] = $this->resolvePath($request->certificate);
        }

        // Handle Photo
        if ($request->hasFile('photo')) {
            if ($award->getRawOriginal('photo') && !filter_var($award->getRawOriginal('photo'), FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($award->getRawOriginal('photo'));
            }
            $validated['photo'] = $request->file('photo')->store('awards/photos', 'public');
        } elseif ($request->has('photo')) {
            $validated['photo'] = $this->resolvePath($request->photo);
        }

        $award->update($validated);
        $award->load(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name']);

        return response()->json($award);
    }

    /**
     * Resolve incoming media (URL or Path) to a clean database path
     */
    private function resolvePath($value)
    {
        if (empty($value)) return null;
        if (!is_string($value)) return null;

        $path = $value;
        $storageUrl = Storage::disk('public')->url('');

        // Handle full URLs
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            // 1. Check if it starts with the configured Public Storage URL
            if (!empty($storageUrl) && str_starts_with($path, $storageUrl)) {
                return ltrim(str_replace($storageUrl, '', $path), '/');
            }
            
            // 2. Fallback: If it contains /storage/, it's likely a local absolute path or proxy
            if (str_contains($path, '/storage/')) {
                $parts = explode('/storage/', $path);
                return ltrim(end($parts), '/');
            }
            
            // 3. Keep as is (likely external or already relative)
            return $path;
        }

        // Handle relative paths (standardize by removing storage prefixes)
        if (str_starts_with($path, '/storage/')) {
            $path = substr($path, 9);
        } elseif (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8);
        }

        return ltrim($path, '/');
    }

    public function destroy(Award $award)
    {
        // Delete associated files if they are not external URLs
        foreach (['certificate', 'photo'] as $field) {
            $path = $award->getRawOriginal($field);
            if ($path && !filter_var($path, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($path);
            }
        }

        $award->delete();
        return response()->json(null, 204);
    }
}
