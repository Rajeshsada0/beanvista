<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->role !== 'super_admin') {
            $tenantId = $user->tenant_id;
            $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : null;

            if (!$tenant) {
                // Cafe has been deleted
                \Illuminate\Support\Facades\Auth::logout();
                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your cafe account has been deleted.',
                    ], 401);
                }

                return redirect('/login')->withErrors([
                    'email' => 'Your cafe account has been deleted.',
                ]);
            }

            if (!$tenant->is_active) {
                // Cafe has been deactivated
                \Illuminate\Support\Facades\Auth::logout();
                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your cafe account has been disabled. Please contact support.',
                    ], 403);
                }

                return redirect('/login')->withErrors([
                    'email' => 'Your cafe account has been disabled. Please contact support.',
                ]);
            }
        }

        return $next($request);
    }
}
