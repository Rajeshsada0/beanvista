<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\LoyaltyReward;
use App\Models\Menu;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Storage;

use App\Traits\CompressesImages;

class LoyaltyRewardController extends Controller
{
    use CompressesImages;
    public function index()
    {
        return inertia('Loyalty/Rewards', [
            'rewards' => LoyaltyReward::with('menuItem')->latest()->get(),
            'menus' => Menu::where('status', true)->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'points_required' => 'required_if:type,gift|nullable|integer|min:0',
            'type' => 'required|in:gift,discount,voucher',
            'menu_item_id' => 'required_if:type,gift|nullable|exists:menus,id',
            'discount_type' => 'required_if:type,discount,voucher|nullable|in:percentage,fixed',
            'discount_value' => 'required_if:type,discount,voucher|nullable|numeric|min:0.01',
            'code' => 'required_if:type,voucher|nullable|string',
            'status' => 'boolean',
            'image' => 'nullable'
        ]);

        $data = $request->except('image');
        
        // Sanitize fields based on type
        if ($data['type'] === 'gift') {
            $data['discount_type'] = null;
            $data['discount_value'] = null;
            $data['code'] = null;
            
            if ($request->hasFile('image')) {
                $tenantId = auth()->user()->tenant_id;
                $data['image_path'] = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/rewards");
            } elseif (is_string($request->image)) {
                $data['image_path'] = $request->image;
            }
        } else {
            $data['menu_item_id'] = null;
            $data['points_required'] = 0;
            $data['image_path'] = null;
            if ($data['type'] === 'discount') {
                $data['code'] = null;
            }
        }

        $reward = LoyaltyReward::create($data);

        ActivityLog::record('created', "New loyalty reward created: {$reward->name} ({$reward->points_required} pts)", $reward);

        return back()->with('success', 'Loyalty reward created.');
    }

    public function update(Request $request, LoyaltyReward $loyalty_reward)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'points_required' => 'required_if:type,gift|nullable|integer|min:0',
            'type' => 'required|in:gift,discount,voucher',
            'menu_item_id' => 'required_if:type,gift|nullable|exists:menus,id',
            'discount_type' => 'required_if:type,discount,voucher|nullable|in:percentage,fixed',
            'discount_value' => 'required_if:type,discount,voucher|nullable|numeric|min:0.01',
            'code' => 'required_if:type,voucher|nullable|string',
            'status' => 'boolean',
            'image' => 'nullable'
        ]);

        $data = $request->except(['image', 'status']);
        $data['status'] = $request->boolean('status');

        // Sanitize fields based on type
        if ($data['type'] === 'gift') {
            $data['discount_type'] = null;
            $data['discount_value'] = null;
            $data['code'] = null;

            if ($request->hasFile('image')) {
                if ($loyalty_reward->image_path) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($loyalty_reward->image_path);
                }
                $tenantId = auth()->user()->tenant_id;
                $data['image_path'] = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/rewards");
            } elseif (is_string($request->image)) {
                $data['image_path'] = $request->image;
            }
        } else {
            $data['menu_item_id'] = null;
            $data['points_required'] = 0;
            if ($loyalty_reward->image_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($loyalty_reward->image_path);
            }
            $data['image_path'] = null;
            if ($data['type'] === 'discount') {
                $data['code'] = null;
            }
        }

        $loyalty_reward->update($data);

        ActivityLog::record('updated', "Loyalty reward updated: {$loyalty_reward->name}", $loyalty_reward);

        return back()->with('success', 'Loyalty reward updated.');
    }

    public function destroy($id)
    {
        $reward = LoyaltyReward::findOrFail($id);
        $name = $reward->name;
        
        // Record activity without the subject object to avoid issues on delete
        ActivityLog::record('deleted', "Loyalty reward removed: {$name}");

        if ($reward->image_path) {
            Storage::disk('public')->delete($reward->image_path);
        }
        
        $reward->delete();

        return back()->with('success', 'Loyalty reward deleted.');
    }
}
