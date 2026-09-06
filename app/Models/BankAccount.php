<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'account_name',
        'account_number',
        'bank_name',
        'account_type',
        'qr_code',
        'gl_account_id',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    protected $appends = [
        'qr_code_url',
    ];

    public function getQrCodeUrlAttribute()
    {
        if (!$this->qr_code) {
            return null;
        }

        if (str_starts_with($this->qr_code, 'http')) {
            return $this->qr_code;
        }

        return rtrim(config('app.url'), '/') . '/storage/' . ltrim($this->qr_code, '/');
    }

    public function glAccount()
    {
        return $this->belongsTo(Account::class, 'gl_account_id');
    }

    public function transactions()
    {
        return $this->hasMany(BankTransaction::class);
    }
}
