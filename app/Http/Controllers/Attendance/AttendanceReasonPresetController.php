<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceReasonPreset;
use Illuminate\Http\Request;

class AttendanceReasonPresetController extends Controller
{
    public function index()
    {
        return response()->json(AttendanceReasonPreset::orderBy('sort_order')->get());
    }

    public function store(Request $request)
    {
        $request->merge([
            'is_active' => $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true,
        ]);

        $validated = $request->validate([
            'reason_text' => 'required|string|max:255',
            'type' => 'required|in:late,early,both',
            'is_active' => 'boolean',
            'sort_order' => 'integer'
        ]);

        $preset = AttendanceReasonPreset::create($validated);
        return response()->json($preset);
    }

    public function update(Request $request, AttendanceReasonPreset $reasonPreset)
    {
        if ($request->has('is_active')) {
            $request->merge([
                'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        $validated = $request->validate([
            'reason_text' => 'required|string|max:255',
            'type' => 'required|in:late,early,both',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer'
        ]);

        $reasonPreset->update($validated);
        return response()->json($reasonPreset);
    }

    public function destroy(AttendanceReasonPreset $reasonPreset)
    {
        $reasonPreset->delete();
        return response()->json(['message' => 'Preset deleted successfully']);
    }

    public function toggleActive(AttendanceReasonPreset $reasonPreset)
    {
        $reasonPreset->update(['is_active' => !$reasonPreset->is_active]);
        return response()->json($reasonPreset);
    }
}
