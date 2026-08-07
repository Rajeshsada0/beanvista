<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 'name', 'category', 'category_id', 'price', 'original_price', 'cost_price', 'status', 'send_to_kitchen', 'image_path', 'icon_path'];

    public function category_group()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function recipes()
    {
        return $this->hasMany(MenuRecipe::class);
    }

    protected $casts = [
        'status' => 'boolean',
        'send_to_kitchen' => 'boolean',
    ];

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;
        $ts = $this->updated_at ? $this->updated_at->timestamp : time();
        return url('/img/' . $this->image_path) . '?v=' . $ts;
    }

    /**
     * Get the full URL for the icon with cache busting.
     */
    public function getIconUrlAttribute()
    {
        if (!$this->icon_path) return null;
        $ts = $this->updated_at ? $this->updated_at->timestamp : time();
        return url('/img/' . $this->icon_path) . '?v=' . $ts;
    }

    protected $appends = ['image_url', 'icon_url'];
}
