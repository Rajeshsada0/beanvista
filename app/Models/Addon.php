<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Addon extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 'name', 'price', 'status'];

    protected $casts = [
        'status' => 'boolean',
        'price' => 'decimal:2',
    ];
}
