<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'cafe_name' => 'required|string|max:255|unique:tenants,name',
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone_code' => 'required|string|max:10',
            'phone' => 'required|string|max:20',
            'password' => ['required', Rules\Password::defaults()],
        ]);

        if (User::isDisposableEmail($request->email)) {
            throw ValidationException::withMessages([
                'email' => ['Disposable or temporary email addresses are not allowed. Please use a valid email address.'],
            ]);
        }

        $tenantSlug = \Illuminate\Support\Str::slug($request->cafe_name);
        
        // Ensure slug is unique
        $originalSlug = $tenantSlug;
        $counter = 1;
        while (\App\Models\Tenant::where('slug', $tenantSlug)->exists()) {
            $tenantSlug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $tenant = \App\Models\Tenant::create([
            'name' => $request->cafe_name,
            'slug' => $tenantSlug,
            'trial_ends_at' => now()->addDays(30),
        ]);

        $phone = $request->phone_code . $request->phone;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $phone,
            'password' => Hash::make($request->password),
            'role' => 'admin', // the creator is the admin of the tenant
        ]);
        
        // Explicitly set tenant_id just in case the trait is not working in this context or isn't authenticated yet
        $user->tenant_id = $tenant->id;
        $user->save();

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
