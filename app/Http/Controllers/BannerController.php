<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Banner;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;
use App\Traits\CompressesImages;

class BannerController extends Controller
{
    use CompressesImages;

    public function index()
    {
        return inertia('Banners/Index', [
            'banners' => Banner::orderBy('sort_order')->latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:550',
            'badge_text' => 'nullable|string|max:100',
            'bg_gradient' => 'nullable|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'nullable|integer',
            'image' => 'nullable'
        ]);

        if ($request->hasFile('image')) {
            $tenantId = auth()->user()->tenant_id;
            $validated['image_path'] = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/banners");
        } elseif ($request->image === '__REMOVE__') {
            $validated['image_path'] = null;
        } elseif (is_string($request->image) && $request->image !== '') {
            $validated['image_path'] = $request->image;
        }

        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['bg_gradient'] = $validated['bg_gradient'] ?? 'from-orange-600 via-amber-600 to-slate-900';

        $banner = Banner::create($validated);
        ActivityLog::record('created', "Added promotional banner: {$banner->title}", $banner);

        return back()->with('success', 'Promotional banner created successfully.');
    }

    public function update(Request $request, Banner $banner)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:550',
            'badge_text' => 'nullable|string|max:100',
            'bg_gradient' => 'nullable|string|max:255',
            'status' => 'boolean',
            'sort_order' => 'nullable|integer',
            'image' => 'nullable'
        ]);

        if ($request->hasFile('image')) {
            if ($banner->image_path) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $tenantId = auth()->user()->tenant_id;
            $validated['image_path'] = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/banners");
        } elseif ($request->image === '__REMOVE__') {
            if ($banner->image_path) {
                Storage::disk('public')->delete($banner->image_path);
            }
            $validated['image_path'] = null;
        } elseif (is_string($request->image) && $request->image !== '') {
            $validated['image_path'] = $request->image;
        }

        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $banner->update($validated);

        ActivityLog::record('updated', "Updated promotional banner: {$banner->title}", $banner);

        return back()->with('success', 'Promotional banner updated successfully.');
    }

    public function destroy(Banner $banner)
    {
        $title = $banner->title;
        if ($banner->image_path) {
            Storage::disk('public')->delete($banner->image_path);
        }
        $banner->delete();
        ActivityLog::record('deleted', "Removed promotional banner: {$title}");

        return back()->with('success', 'Promotional banner removed.');
    }

    public function toggleStatus(Banner $banner)
    {
        $banner->update(['status' => !$banner->status]);
        ActivityLog::record('updated', "Toggled status for banner: {$banner->title}", $banner);

        return back()->with('success', 'Banner status updated.');
    }
}
