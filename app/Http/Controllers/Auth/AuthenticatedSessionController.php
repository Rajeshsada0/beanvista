<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        
        if ($user->role !== 'super_admin' && $user->tenant && !$user->tenant->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            
            return back()->withErrors([
                'email' => 'Your cafe account has been disabled. Please contact to admin.',
            ]);
        }

        // Auto-correct primary_branch_id
        if ($user->tenant_id && !$user->primary_branch_id) {
            $firstBranch = \App\Models\Branch::where('tenant_id', $user->tenant_id)->first();
            if ($firstBranch) {
                $user->update(['primary_branch_id' => $firstBranch->id]);
            }
        }
        
        if ($user->role === 'kitchen') {
            return redirect()->route('orders.kds');
        } elseif (in_array($user->role, ['staff', 'cashier', 'waiter'])) {
            return redirect()->route('table-book');
        } elseif ($user->role === 'super_admin') {
            return redirect()->route('superadmin.dashboard');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return Inertia::location('/');
    }
}
