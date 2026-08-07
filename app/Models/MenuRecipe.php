<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class MenuRecipe extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'menu_id',
        'inventory_item_id',
        'quantity_per_serving',
    ];

    protected $casts = [
        'quantity_per_serving' => 'float',
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
