<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::hasUser()) {
            $user = Auth::user();
            
            // Super admins can see everything across all tenants
            if ($user->role === 'super_admin') {
                return;
            }

            if (!empty($user->tenant_id)) {
                // Scope query strictly to user's tenant_id
                $builder->where('tenant_id', $user->tenant_id);
            } else {
                // User has no valid tenant_id (e.g. cafe deleted) -> return 0 results
                $builder->whereRaw('1 = 0');
            }
        }
    }
}
