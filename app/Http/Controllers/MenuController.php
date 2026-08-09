<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Menu;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;

use App\Traits\CompressesImages;

class MenuController extends Controller
{
    use CompressesImages;
    public function index()
    {
        return inertia('Menu/Index', [
            'menus' => \App\Models\Menu::all(),
            'db_categories' => \App\Models\Category::where('status', true)->get()
        ]);
    }

    public function show(Menu $menu)
    {
        return inertia('Menu/Show', [
            'menu' => $menu,
            'category' => $menu->category_group
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'original_price' => 'nullable|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'status' => 'boolean',
            'send_to_kitchen' => 'boolean',
            'image' => 'nullable',
            'icon' => 'nullable',
        ]);

        $category = \App\Models\Category::find($validated['category_id']);
        $validated['category'] = $category->name;

        if ($request->hasFile('image')) {
            $tenantId = auth()->user()->tenant_id;
            $validated['image_path'] = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/menus/images");
        } elseif (is_string($request->image)) {
            $validated['image_path'] = $request->image;
        }

        if ($request->hasFile('icon')) {
            $tenantId = auth()->user()->tenant_id;
            $validated['icon_path'] = $this->compressAndSaveImage($request->file('icon'), "tenants/{$tenantId}/menus/icons");
        } elseif (is_string($request->icon)) {
            $validated['icon_path'] = $request->icon;
        }

        $validated['cost_price'] = $validated['cost_price'] ?? 0;

        $menu = Menu::create($validated);

        ActivityLog::record('created', "Added new menu item: {$menu->name}", $menu);

        return back()->with('success', 'Menu item added.');
    }

    public function update(Request $request, Menu $menu)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:categories,id',
            'original_price' => 'nullable|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'status' => 'boolean',
            'send_to_kitchen' => 'boolean',
            'image' => 'nullable',
            'icon' => 'nullable',
        ]);

        $category = \App\Models\Category::find($validated['category_id']);
        $validated['category'] = $category->name;

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($menu->image_path) {
                Storage::disk('public')->delete($menu->image_path);
            }
            $tenantId = auth()->user()->tenant_id;
            $validated['image_path'] = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/menus/images");
        } elseif (is_string($request->image) && $request->image !== '') {
            $validated['image_path'] = $request->image;
        }

        if ($request->hasFile('icon')) {
            // Delete old icon if exists
            if ($menu->icon_path) {
                Storage::disk('public')->delete($menu->icon_path);
            }
            $tenantId = auth()->user()->tenant_id;
            $validated['icon_path'] = $this->compressAndSaveImage($request->file('icon'), "tenants/{$tenantId}/menus/icons");
        } elseif (is_string($request->icon) && $request->icon !== '') {
            $validated['icon_path'] = $request->icon;
        }

        $validated['cost_price'] = $validated['cost_price'] ?? 0;

        $oldPrice = $menu->price;
        $menu->update($validated);

        if ($oldPrice != $menu->price) {
            ActivityLog::record('updated', "Updated price for {$menu->name} from {$oldPrice} to {$menu->price}", $menu);
        } else {
            ActivityLog::record('updated', "Updated details for menu item: {$menu->name}", $menu);
        }

        return back()->with('success', 'Menu item updated.');
    }

    public function destroy(Menu $menu)
    {
        $name = $menu->name;
        $menu->delete();
        ActivityLog::record('deleted', "Removed menu item: {$name}");
        return back()->with('success', 'Menu item deleted.');
    }
}
