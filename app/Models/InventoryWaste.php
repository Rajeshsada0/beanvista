<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class InventoryWaste extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $table = 'inventory_wastes';

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'inventory_item_id',
        'menu_id',
        'quantity',
        'waste_date',
        'cost_per_unit',
        'total_loss',
        'reason',
        'notes',
    ];

    protected $casts = [
        'waste_date' => 'date',
        'quantity' => 'float',
        'cost_per_unit' => 'float',
        'total_loss' => 'float',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }
}
