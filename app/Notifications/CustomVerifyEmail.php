<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail as VerifyEmailBase;
use Illuminate\Notifications\Messages\MailMessage;

class CustomVerifyEmail extends VerifyEmailBase
{
    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);

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

        return (new MailMessage)
            ->subject("Verify Your Email Address - {$tenantName}")
            ->greeting("Hello {$userName},")
            ->line("Welcome to {$tenantName}! Thank you for creating an account with us.")
            ->line("Please click the button below to verify your email address and activate your cafe management workspace.")
            ->action('Verify Email Address', $verificationUrl)
            ->line("If you did not create an account at {$tenantName}, no further action is required.")
            ->salutation("Best regards,\nThe {$tenantName} Team");
    }
}
