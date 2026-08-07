<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tax extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    use HasFactory;

    protected $fillable = [
        'branch_id', 
        'name',
        'rate',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'rate' => 'decimal:2',
    ];
}
