<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class LoyaltyReward extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 
        'name',
        'description',
        'points_required',
        'menu_item_id',
        'status',
        'image_path',
        'type',
        'discount_type',
        'discount_value',
        'code'
    ];

    protected $casts = [
        'status' => 'boolean',
        'points_required' => 'integer',
        'discount_value' => 'float',
    ];

    public function menuItem()
    {
        return $this->belongsTo(Menu::class, 'menu_item_id');
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;
        $ts = $this->updated_at ? $this->updated_at->timestamp : time();
        return url('/img/' . $this->image_path) . '?v=' . $ts;
    }

    protected $appends = ['image_url'];
}
