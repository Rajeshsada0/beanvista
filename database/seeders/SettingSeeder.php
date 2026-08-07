<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the default tenant (ID = 1)
        $tenant = \App\Models\Tenant::find(1);
        
        if (!$tenant) {
            // If tenant doesn't exist, create it
            $tenant = \App\Models\Tenant::updateOrCreate(
                ['id' => 1],
                [
                    'name' => 'Default Cafe',
                    'slug' => 'default-cafe',
                    'is_active' => true,
                ]
            );
        }

        $settings = [
            ['key' => 'site_name', 'value' => 'AI Cafe POS', 'type' => 'text', 'tenant_id' => 1],
            ['key' => 'site_description', 'value' => 'Premium Table Booking & Order Management System', 'type' => 'text', 'tenant_id' => 1],
            ['key' => 'site_logo', 'value' => null, 'type' => 'file', 'tenant_id' => 1],
            ['key' => 'site_favicon', 'value' => null, 'type' => 'file', 'tenant_id' => 1],
            ['key' => 'currency_symbol', 'value' => 'रू.', 'type' => 'text', 'tenant_id' => 1],
            ['key' => 'contact_phone', 'value' => '+977-1234567890', 'type' => 'text', 'tenant_id' => 1],
            ['key' => 'contact_email', 'value' => 'hello@aicafepos.com', 'type' => 'text', 'tenant_id' => 1],
            ['key' => 'points_per_currency', 'value' => '0.01', 'type' => 'number', 'tenant_id' => 1], // Points earned per currency unit (e.g., 0.01 = 1 point per 100 rupees)
            ['key' => 'points_to_currency_rate', 'value' => '1', 'type' => 'number', 'tenant_id' => 1], // 1 point = X currency units
        ];

        foreach ($settings as $setting) {
            \App\Models\Setting::updateOrCreate(['key' => $setting['key'], 'tenant_id' => 1], $setting);
        }

        $globalSettings = [
            ['key' => 'enable_biometric', 'value' => 'true', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'enable_contact_call', 'value' => 'true', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'contact_call_number', 'value' => '+977-1234567890', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'enable_contact_email', 'value' => 'true', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'contact_email_address', 'value' => 'hello@aicafepos.com', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'enable_contact_whatsapp', 'value' => 'true', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'contact_whatsapp_number', 'value' => '+977-1234567890', 'type' => 'text', 'tenant_id' => null],
            ['key' => 'faq_content', 'value' => json_encode([
                ['question' => 'What is BeanVista POS?', 'answer' => 'BeanVista POS is an all-in-one cafe management platform combining a point-of-sale system, kitchen display system (KDS), inventory management, customer loyalty rewards, and table booking — all in one dashboard.'],
                ['question' => 'How long does setup take?', 'answer' => 'Most cafes go live in under 60 minutes. Our onboarding imports your existing menu and we provide a dedicated setup specialist for your first shift.'],
                ['question' => 'Can I try BeanVista POS for free?', 'answer' => 'Yes. We offer a full 30-day free trial with no credit card required. You get access to all Professional plan features during your trial.'],
                ['question' => 'Does BeanVista POS work for multi-branch cafes?', 'answer' => 'Absolutely. Our Professional and Enterprise plans support multiple branches with a centralized dashboard for cross-location reporting, inventory, and staff management.'],
                ['question' => 'What payment methods does BeanVista POS support?', 'answer' => 'BeanVista POS supports tap-to-pay, QR code payments, cash, split tender, and credit/debit cards across 28 markets at a flat 0.5% rate.']
            ]), 'type' => 'text', 'tenant_id' => null],
        ];

        foreach ($globalSettings as $setting) {
            \App\Models\Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => $setting['key'], 'tenant_id' => null],
                $setting
            );
        }
    }
}
