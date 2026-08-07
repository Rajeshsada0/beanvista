<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'name',
        'category', // keeping for legacy
        'unit', // keeping for legacy
        'current_stock',
        'low_stock_threshold',
        'stock_group_id',
        'measuring_unit_id',
        'tenant_id',
        'branch_id',
    ];

    public function purchases()
    {
        return $this->hasMany(InventoryPurchase::class);
    }

    public function usages()
    {
        return $this->hasMany(InventoryUsage::class);
    }

    public function stockGroup()
    {
        return $this->belongsTo(StockGroup::class);
    }

    public function measuringUnit()
    {
        return $this->belongsTo(MeasuringUnit::class);
    }

    public function menuRecipes()
    {
        return $this->hasMany(MenuRecipe::class);
    }
}

