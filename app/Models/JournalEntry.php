<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'reference_number',
        'date',
        'description',
        'status',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
