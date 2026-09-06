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

    protected static function booted()
    {
        static::saving(function ($account) {
            if (isset($account->attributes['qr_code']) && !\Illuminate\Support\Facades\Schema::hasColumn('bank_accounts', 'qr_code')) {
                try {
                    \Illuminate\Support\Facades\Schema::table('bank_accounts', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->string('qr_code')->nullable()->after('account_type');
                    });
                } catch (\Throwable $e) {
                    unset($account->attributes['qr_code']);
                }
            }
        });
    }

    public function getQrCodeUrlAttribute()
    {
        $qrCode = $this->attributes['qr_code'] ?? null;
        if (!$qrCode) {
            return null;
        }

        if (str_starts_with($qrCode, 'http')) {
            if (str_contains($qrCode, '/storage/')) {
                return str_replace('/storage/', '/img/', $qrCode);
            }
            return $qrCode;
        }

        $cleanPath = ltrim(str_replace('app/public/', '', $qrCode), '/');
        return url('/img/' . $cleanPath);
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
