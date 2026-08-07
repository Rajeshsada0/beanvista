<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Setting;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Settings/Index');
    }

    public function update(Request $request)
    {
        $settings = $request->except(['_token', '_method']);

        foreach ($settings as $key => $value) {
            $setting = Setting::firstOrCreate(
                ['key' => $key],
                ['type' => 'text'] // Default type for new keys
            );

            if ($request->hasFile($key)) {
                // Ensure type is file
                if ($setting->type !== 'file') {
                    $setting->update(['type' => 'file']);
                }

                // Delete old file if exists
                if ($setting->value && Storage::disk('public')->exists($setting->value)) {
                    Storage::disk('public')->delete($setting->value);
                }
                
                $path = $request->file($key)->store('settings', 'public');
                $setting->update(['value' => $path]);
            } else if ($setting->type !== 'file') {
                $setting->update(['value' => $value]);
            }
        }

        if (auth()->check()) {
            cache()->forget('settings_tenant_' . auth()->user()->tenant_id);
        }

        return back()->with('success', 'Settings updated successfully.');
    }
}
