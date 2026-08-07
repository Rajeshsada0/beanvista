<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic Plan',
                'description' => 'Essential invoicing & business tracking features for growing firms.',
                'price_monthly' => 99.00,
                'price_3_months' => 270.00,
                'price_6_months' => 500.00,
                'price_yearly' => 999.00,
                'trial_days' => 14,
                'features' => json_encode(['Sale Invoices', 'Purchase Tracking', 'Reports Overview']),
                'is_active' => true,
            ],
            [
                'name' => 'Premium Plan',
                'description' => 'Advanced custom widgets, unlimited transaction documents, and standard layout designs.',
                'price_monthly' => 199.00,
                'price_3_months' => 540.00,
                'price_6_months' => 1000.00,
                'price_yearly' => 1999.00,
                'trial_days' => 14,
                'features' => json_encode(['All Basic Features', 'Custom Widgets', 'Barcode Generator', 'Bulk Item Updates', 'Export to Tally']),
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise Plan',
                'description' => 'Extended 24-month validity, priority technical support, and unlimited data exports.',
                'price_monthly' => 499.00,
                'price_3_months' => 1350.00,
                'price_6_months' => 2500.00,
                'price_yearly' => 4999.00,
                'trial_days' => 14,
                'features' => json_encode(['All Premium Features', '24 Months Validity', 'Multi-user sharing', 'Priority Tech Support']),
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            \App\Models\Plan::updateOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
