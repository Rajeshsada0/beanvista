<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class StockGroup extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 
        'name',
        'description',
    ];

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class);
    }
}
