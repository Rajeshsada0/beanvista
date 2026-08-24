<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        // Notice we disable global scopes to get ALL users, because the super_admin might want to see everyone.
        // Wait, the BelongsToTenant scope only applies if the user has a tenant_id. Since SuperAdmin might have null, it might see all anyway.
        // To be safe, we use withoutGlobalScope.
        $users = \App\Models\User::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->with('tenant')
            ->latest()
            ->get();

        $appName = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_name')->value('value') ?? 'iCafe';
        $appVersion = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_version')->value('value') ?? 'v1.0';
        $siteFavicon = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'site_favicon')->value('value');
        $enableBiometric = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_biometric')->value('value') ?? 'true';
        $enableContactCall = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_contact_call')->value('value') ?? 'true';
        $contactCallNumber = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'contact_call_number')->value('value') ?? '+977-1234567890';
        $enableContactEmail = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_contact_email')->value('value') ?? 'true';
        $contactEmailAddress = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'contact_email_address')->value('value') ?? 'hello@aicafepos.com';
        $enableContactWhatsapp = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_contact_whatsapp')->value('value') ?? 'true';
        $contactWhatsappNumber = \App\Models\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'contact_whatsapp_number')->value('value') ?? '+977-1234567890';
            
        return \Inertia\Inertia::render('Superadmin/Users/Index', [
            'users' => $users,
            'app_name' => $appName,
            'app_version' => $appVersion,
            'site_favicon' => $siteFavicon ? asset('storage/' . $siteFavicon) : null,
            'enable_biometric' => $enableBiometric,
            'enable_contact_call' => $enableContactCall,
            'contact_call_number' => $contactCallNumber,
            'enable_contact_email' => $enableContactEmail,
            'contact_email_address' => $contactEmailAddress,
            'enable_contact_whatsapp' => $enableContactWhatsapp,
            'contact_whatsapp_number' => $contactWhatsappNumber,
        ]);
    }

    public function create()
    {
        $tenants = \App\Models\Tenant::all();
        return \Inertia\Inertia::render('Superadmin/Users/CreateEdit', [
            'tenants' => $tenants
        ]);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => ['required', \Illuminate\Validation\Rules\Password::defaults()],
            'role' => 'required|in:super_admin,admin,staff,kitchen',
            'tenant_id' => 'nullable|exists:tenants,id',
        ]);

        \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'tenant_id' => $request->tenant_id,
        ]);

        return redirect()->route('superadmin.users.index')->with('success', 'User created successfully.');
    }

    public function edit($id)
    {
        $user = \App\Models\User::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->findOrFail($id);
        $tenants = \App\Models\Tenant::all();
        return \Inertia\Inertia::render('Superadmin/Users/CreateEdit', [
            'user' => $user,
            'tenants' => $tenants
        ]);
    }

    public function update(\Illuminate\Http\Request $request, $id)
    {
        $user = \App\Models\User::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', \Illuminate\Validation\Rules\Password::defaults()],
            'role' => 'required|in:super_admin,admin,staff,kitchen',
            'tenant_id' => 'nullable|exists:tenants,id',
        ]);

        $data = $request->only(['name', 'email', 'phone', 'role', 'tenant_id']);
        if ($request->filled('password')) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('superadmin.users.index')->with('success', 'User updated successfully.');
    }

    public function destroy($id)
    {
        $user = \App\Models\User::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->findOrFail($id);
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete yourself.');
        }
        $user->delete();
        return redirect()->route('superadmin.users.index')->with('success', 'User deleted successfully.');
    }

    public function updateAppSettings(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'app_name' => 'required|string|max:255',
            'app_version' => 'required|string|max:255',
            'favicon' => 'nullable|image|max:2048',
            'enable_biometric' => 'required|string|in:true,false',
            'enable_contact_call' => 'required|string|in:true,false',
            'contact_call_number' => 'nullable|string|max:255',
            'enable_contact_email' => 'required|string|in:true,false',
            'contact_email_address' => 'nullable|string|email|max:255',
            'enable_contact_whatsapp' => 'required|string|in:true,false',
            'contact_whatsapp_number' => 'nullable|string|max:255',
        ]);

        \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'app_name', 'tenant_id' => null, 'branch_id' => null],
            ['value' => $request->app_name, 'type' => 'text']
        );

        \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'app_version', 'tenant_id' => null, 'branch_id' => null],
            ['value' => $request->app_version, 'type' => 'text']
        );

        if ($request->hasFile('favicon')) {
            $path = $request->file('favicon')->store('settings', 'public');
            \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => 'site_favicon', 'tenant_id' => null, 'branch_id' => null],
                ['value' => $path, 'type' => 'file']
            );
        }

        $keys = [
            'enable_biometric',
            'enable_contact_call',
            'contact_call_number',
            'enable_contact_email',
            'contact_email_address',
            'enable_contact_whatsapp',
            'contact_whatsapp_number'
        ];

        foreach ($keys as $key) {
            \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => $key, 'tenant_id' => null, 'branch_id' => null],
                ['value' => $request->input($key) ?? '', 'type' => 'text']
            );
        }

        return back()->with('success', 'App settings updated successfully.');
    }
}
