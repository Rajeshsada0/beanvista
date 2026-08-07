<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class BranchScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::hasUser()) {
            $user = Auth::user();

            // Super admins see everything across all branches and tenants
            if ($user->role === 'super_admin') {
                return;
            }

            // Only scope if the session has an active branch ID or we have auth fallback
            if (session()->has('active_branch_id')) {
                // Scopes the query to the active branch
                $builder->where($model->getTable() . '.branch_id', session('active_branch_id'));
            } elseif ($user->primary_branch_id) {
                // Scopes the query to the user's primary branch (API stateless fallback)
                $builder->where($model->getTable() . '.branch_id', $user->primary_branch_id);
            }
        }
    }
}
