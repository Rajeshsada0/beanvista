<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        // Not authenticated — let the auth middleware handle this
        if (! $user) {
            return redirect()->route('login');
        }

        // Role is allowed — continue
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // Role not allowed — redirect to the user's correct home page
        $message = 'Access Restricted.';
        return match($user->role) {
            'super_admin' => redirect()->route('superadmin.dashboard')->with('error', $message),
            'admin'       => redirect()->route('dashboard')->with('error', $message),
            'staff', 'cashier', 'waiter' => redirect()->route('table-book')->with('error', $message),
            'kitchen'     => redirect()->route('orders.kds')->with('error', $message),
            default       => redirect()->route('login'),
        };
    }
}
