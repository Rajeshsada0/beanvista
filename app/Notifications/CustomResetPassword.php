<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordBase;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPassword extends ResetPasswordBase
{
    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $userName = $notifiable->name ?? 'Valued Customer';

        // Fetch cafe/tenant name if available
        $tenantName = 'BeanVista POS';
        if (isset($notifiable->tenant) && $notifiable->tenant && strtolower($notifiable->tenant->name) !== 'laravel') {
            $tenantName = $notifiable->tenant->name;
        } elseif (!empty($notifiable->tenant_id)) {
            $tenant = \App\Models\Tenant::find($notifiable->tenant_id);
            if ($tenant && strtolower($tenant->name) !== 'laravel') {
                $tenantName = $tenant->name;
            }
        }

        $resetUrl = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject("Reset Your Password - {$tenantName}")
            ->greeting("Hello {$userName},")
            ->line("You are receiving this email because we received a password reset request for your account at {$tenantName}.")
            ->action('Reset Password', $resetUrl)
            ->line("This password reset link will expire in " . config('auth.passwords.'.config('auth.defaults.passwords').'.expire') . " minutes.")
            ->line("If you did not request a password reset, no further action is required.")
            ->salutation("Best regards,\nThe {$tenantName} Team");
    }
}
