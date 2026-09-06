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

            $branchId = session('active_branch_id') ?: $user->primary_branch_id;

            // Only scope if the session has an active branch ID or we have auth fallback
            if ($branchId) {
                $table = $model->getTable();
                // Catalog and configuration data should include global tenant records (where branch_id IS NULL)
                if (in_array($table, ['menus', 'categories', 'addons', 'taxes', 'tables', 'bank_accounts', 'banners', 'loyalty_rewards'])) {
                    $builder->where(function ($q) use ($table, $branchId) {
                        $q->where($table . '.branch_id', $branchId)
                          ->orWhereNull($table . '.branch_id');
                    });
                } else {
                    $builder->where($table . '.branch_id', $branchId);
                }
            }
        }
    }
}
