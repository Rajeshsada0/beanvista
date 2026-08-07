<?php

namespace App\Traits;

use App\Models\Scopes\BranchScope;

trait BelongsToBranch
{
    /**
     * Boot the trait.
     */
    protected static function bootBelongsToBranch()
    {
        static::addGlobalScope(new BranchScope);

        static::creating(function ($model) {
            // Only auto-assign if branch_id is not explicitly provided in the attributes
            if (session()->has('active_branch_id') && !array_key_exists('branch_id', $model->getAttributes())) {
                $model->branch_id = session('active_branch_id');
            } elseif (auth()->check() && auth()->user()->primary_branch_id && !array_key_exists('branch_id', $model->getAttributes())) {
                $model->branch_id = auth()->user()->primary_branch_id;
            }
        });
    }

    public function branch()
    {
        return $this->belongsTo(\App\Models\Branch::class);
    }
}
