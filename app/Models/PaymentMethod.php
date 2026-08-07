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
        // Build correct public URL: APP_URL/storage/<path>
        // Do NOT use Storage::disk('public')->url() as it may produce wrong path on some servers
        return rtrim(config('app.url'), '/') . '/storage/' . ltrim($this->qr_code, '/');
    }

    public function paymentRequests()
    {
        return $this->hasMany(PaymentRequest::class);
    }
}
