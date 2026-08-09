<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    use BelongsToTenant, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'title',
        'subtitle',
        'badge_text',
        'image_path',
        'bg_gradient',
        'status',
        'sort_order'
    ];

    protected $casts = [
        'status' => 'boolean',
        'sort_order' => 'integer'
    ];

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) return null;
        $ts = $this->updated_at ? $this->updated_at->timestamp : time();
        return url('/img/' . $this->image_path) . '?v=' . $ts;
    }

    protected $appends = ['image_url'];
}
