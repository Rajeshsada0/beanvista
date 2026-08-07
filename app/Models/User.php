<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, BelongsToTenant;

    /**
     * Check if email domain is from a disposable/temporary provider.
     */
    public static function isDisposableEmail($email)
    {
        $disposableDomains = [
            'mailinator.com', 'yopmail.com', 'tempmail.com', 'temp-mail.org', 
            '10minutemail.com', 'sharklasers.com', 'guerrillamail.com', 'dispostable.com', 
            'getairmail.com', 'trashmail.com', 'maildrop.cc', 'mintemail.com', 
            'mailnesia.com', 'getnada.com', 'generator.email', 'tempmailo.com', 
            'fakeinbox.com', 'tempmail.dev', 'dropmail.me', 'spyderweb.com.au', 
            'throwawaymail.com', 'tempmailaddress.com', 'disposable.com', 'tempmail.net',
            'dispostable.com', 'getnada.com', 'disposable.com'
        ];

        $domain = substr(strrchr($email, "@"), 1);
        return in_array(strtolower($domain), $disposableDomains);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'tenant_id',
        'primary_branch_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_user');
    }

    public function primaryBranch()
    {
        return $this->belongsTo(Branch::class, 'primary_branch_id');
    }

    /**
     * Send the email verification notification with personalized user and cafe name.
     */
    public function sendEmailVerificationNotification()
    {
        $this->notify(new \App\Notifications\CustomVerifyEmail);
    }

    /**
     * Send the password reset notification with personalized user and cafe name.
     *
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new \App\Notifications\CustomResetPassword($token));
    }
}
