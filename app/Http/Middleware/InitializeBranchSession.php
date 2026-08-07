<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use App\Models\Branch;

class InitializeBranchSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            // Super admin does not need branch scoping
            if ($user->role !== 'super_admin') {
                if (!session()->has('active_branch_id')) {
                    $branchId = $user->primary_branch_id;

                    // Fallback to first available branch if primary_branch_id is not set
                    if (!$branchId) {
                        $branchId = Branch::where('tenant_id', $user->tenant_id)->value('id');
                    }

                    if ($branchId) {
                        session(['active_branch_id' => (int) $branchId]);
                    }
                } else {
                    // Safety check: Validate that the session branch still belongs to their tenant/access level
                    $sessionBranchId = session('active_branch_id');
                    
                    if ($user->role === 'admin') {
                        $exists = Branch::where('id', $sessionBranchId)->where('tenant_id', $user->tenant_id)->exists();
                    } else {
                        $exists = $user->branches()->where('branches.id', $sessionBranchId)->exists();
                    }

                    if (!$exists) {
                        // Reset to default if access is lost
                        $branchId = $user->primary_branch_id ?: Branch::where('tenant_id', $user->tenant_id)->value('id');
                        if ($branchId) {
                            session(['active_branch_id' => (int) $branchId]);
                        } else {
                            session()->forget('active_branch_id');
                        }
                    }
                }
            }
        }

        return $next($request);
    }
}
