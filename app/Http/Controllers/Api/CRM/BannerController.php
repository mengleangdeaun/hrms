<?php

namespace App\Http\Controllers\Api\CRM;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\CRM\Banner;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BannerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Banner::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('link_url', 'like', "%{$search}%");
            });
        }

        if ($request->filled('banner_type') && $request->banner_type !== 'all') {
            $query->where('banner_type', $request->banner_type);
        }

        $limit = $request->input('limit', 15);
        $banners = $query->with(['service', 'category'])->orderBy('sort_order', 'asc')->paginate($limit);
        
        return response()->json($banners);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'link_url' => 'nullable|string',
            'banner_type' => 'required|string',
            'category_id' => 'nullable|integer',
            'service_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'sometimes',
            'sort_order' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['is_active'] = $request->input('is_active') === '1' || $request->input('is_active') === 1 || $request->input('is_active') === true || $request->input('is_active') === 'on';
        
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        $banner = Banner::create($data);

        return response()->json($banner, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $banner = Banner::findOrFail($id);
        return response()->json($banner);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $banner = Banner::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'image' => 'sometimes|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'link_url' => 'nullable|string',
            'banner_type' => 'sometimes|required|string',
            'category_id' => 'nullable|integer',
            'service_id' => 'nullable|integer',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'is_active' => 'sometimes',
            'sort_order' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if ($request->has('is_active')) {
            $data['is_active'] = $request->input('is_active') === '1' || $request->input('is_active') === 1 || $request->input('is_active') === true || $request->input('is_active') === 'on';
        }

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($banner->image_url) {
                $oldPath = str_replace(Storage::disk('public')->url(''), '', $banner->image_url);
                Storage::disk('public')->delete($oldPath);
            }
            
            $path = $request->file('image')->store('banners', 'public');
            $data['image_url'] = Storage::disk('public')->url($path);
        }

        $banner->update($data);

        return response()->json($banner);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $banner = Banner::findOrFail($id);
        
        // Optionally delete image from storage
        /*
        if ($banner->image_url) {
            $oldPath = str_replace(Storage::disk('public')->url(''), '', $banner->image_url);
            Storage::disk('public')->delete($oldPath);
        }
        */

        $banner->delete();

        return response()->json(['message' => 'Banner deleted successfully']);
    }

    /**
     * Get categories for banners.
     */
    public function categories()
    {
        // Use Services instead of Inventory Categories as requested
        $services = \App\Models\Workshop\Service::where('is_active', 1)->select('id', 'name', 'code')->get();
        return response()->json($services);
    }
}
