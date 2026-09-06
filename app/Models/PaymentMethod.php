<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    protected $fillable = [
        'type',
        'title',
        'details',
        'qr_code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['qr_code_url'];

    public function getQrCodeUrlAttribute()
    {
        if (!$this->qr_code) return null;
        if (str_starts_with($this->qr_code, 'http')) {
            if (str_contains($this->qr_code, '/storage/')) {
                return str_replace('/storage/', '/img/', $this->qr_code);
            }
            return $this->qr_code;
        }
        $cleanPath = ltrim(str_replace('app/public/', '', $this->qr_code), '/');
        return url('/img/' . $cleanPath);
    }

    public function paymentRequests()
    {
        return $this->hasMany(PaymentRequest::class);
    }
}
