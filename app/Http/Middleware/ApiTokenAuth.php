<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    /**
     * Handle an incoming request.
     *
     * Accepts two auth methods:
     *  1. Bearer token  – Flutter / mobile apps
     *  2. Session auth  – Web browser (Inertia/axios requests already have a session)
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        // ── 1. Authenticated via web session (browser) ────────────────
        if (Auth::check()) {
            $user = Auth::user();
            if ($user && $user->role !== 'super_admin') {
                $tenantId = $user->tenant_id;
                $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : null;
                if (!$tenant) {
                    Auth::logout();
                    return response()->json([
                        'success' => false,
                        'message' => 'Your cafe account has been deleted.',
                    ], 401);
                }
                if (!$tenant->is_active) {
                    Auth::logout();
                    return response()->json([
                        'success' => false,
                        'message' => 'Your cafe account has been disabled.',
                    ], 403);
                }
            }
            return $next($request);
        }

        // ── 2. Bearer token authentication (Flutter / API clients) ────────────
        if ($token) {
            $userId = Cache::get('api_token_' . $token);

            if ($userId) {
                Auth::loginUsingId($userId);

                $user = Auth::user();
                if ($user && $user->role !== 'super_admin') {
                    $tenantId = $user->tenant_id;
                    $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : null;
                    if (!$tenant) {
                        Auth::logout();
                        Cache::forget('api_token_' . $token);
                        return response()->json([
                            'success' => false,
                            'message' => 'Your cafe account has been deleted.',
                        ], 401);
                    }
                    if (!$tenant->is_active) {
                        Auth::logout();
                        Cache::forget('api_token_' . $token);
                        return response()->json([
                            'success' => false,
                            'message' => 'Your cafe account has been disabled.',
                        ], 403);
                    }
                }

                // Carry the user's primary branch into the session when available
                if ($user && $user->primary_branch_id) {
                    session(['active_branch_id' => $user->primary_branch_id]);
                }

                return $next($request);
            }
        }

        return response()->json(['message' => 'Unauthorized'], 401);
    }
}
