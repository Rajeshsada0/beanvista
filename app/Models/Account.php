<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 
        'tenant_id',
        'name',
        'code',
        'type',
        'is_system_account',
        'balance',
        'description',
    ];

    protected $casts = [
        'is_system_account' => 'boolean',
        'balance' => 'decimal:2',
    ];

    public function journalEntryLines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
