<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class CmsController extends Controller
{
    /**
     * Display the CMS & SEO Management panel.
     */
    public function index()
    {
        // Get all global settings
        $settingsRaw = Setting::withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->get()
            ->pluck('value', 'key');

        $settings = [
            'seo_title' => $settingsRaw->get('seo_title', 'BeanVista POS — Complete Cafe & Restaurant Management Solution'),
            'seo_description' => $settingsRaw->get('seo_description', 'BeanVista POS is a complete cafe and restaurant management system. POS billing, table reservations, KDS, inventory tracking, staff management, and analytics.'),
            'seo_keywords' => $settingsRaw->get('seo_keywords', 'restaurant pos, cafe pos, kitchen display system, inventory tracking, staff management, loyalty rewards'),
            'site_logo' => $settingsRaw->get('site_logo') ? asset('storage/' . $settingsRaw->get('site_logo')) : null,
            'site_favicon' => $settingsRaw->get('site_favicon') ? asset('storage/' . $settingsRaw->get('site_favicon')) : null,
            
            'contact_email' => $settingsRaw->get('contact_email', 'support@beanvista.com'),
            'contact_phone' => $settingsRaw->get('contact_phone', '+1-555-0199'),
            'contact_address' => $settingsRaw->get('contact_address', '123 Espresso Way, Coffee City'),
            'contact_whatsapp' => $settingsRaw->get('contact_whatsapp', '+15550199'),
            'playstore_url' => $settingsRaw->get('playstore_url', ''),

            'page_about_content' => $settingsRaw->get('page_about_content', "We are a team of coffee lovers and software developers who wanted to build the absolute best operating system for cafes and restaurants.\n\nBeanVista POS was born out of a desire to make kitchen communication seamless and give operators detailed metrics about their sales, inventory, and staff without a clunky interface."),
            'page_privacy_content' => $settingsRaw->get('page_privacy_content', "At BeanVista POS, we are committed to protecting your privacy. This Privacy Policy details how we collect, store, and process your personal and business data.\n\n1. Information We Collect\nWe collect information when you register an account, create a cafe branch, input catalog details, process point-of-sale (POS) transactions, or submit a support ticket. This includes:\n- Personal Details: Full Name, email address, phone number.\n- Business Details: Cafe name, branch locations, menu structures, and tax parameters.\n- Transactional Metrics: Sales tallies, cashier logs, shifts data, and customer loyalty rewards metrics.\n\n2. How We Use Your Information\nWe utilize the collected datasets to:\n- Provision your multi-tenant cafe database.\n- Coordinate kitchen updates and sync POS terminals in real time.\n- Compile business charts, Profit & Loss summaries, and stock warnings.\n- Authenticate cashiers and log system modifications.\n\n3. Data Integrity & Security\nWe use industry-standard encryption protocols (SSL/TLS) to shield transaction files and password hashes. Automated daily backups ensure your business data is secure.\n\n4. Contact Support\nIf you have questions regarding data privacy or account erasure, contact us at support@beanvista.com."),
            'page_tnc_content' => $settingsRaw->get('page_tnc_content', "Welcome to BeanVista POS. By signing up for a trial or purchasing a subscription plan, you agree to comply with the following Terms of Service.\n\n1. Account Registration & Tenant Identity\n- You must supply a valid business name, your full name, and a unique email address to register.\n- You are responsible for all cashier activities, transaction logs, and branch updates performed under your tenant space.\n\n2. Service Delivery & Subscriptions\n- Subscriptions are billed on an annual or monthly cycle, granting access to POS terminals, KDS sync, and reports according to your selected tier.\n- Trial accounts are active for 30 days. Upon expiration, access to dashboards may be restricted until a payment method is registered.\n\n3. Software & Intellectual Property\n- BeanVista POS provides a licensed multi-tenant software service.\n- All dashboard designs, interactive analytics charts, and 3D visual modules remain the exclusive intellectual property of BeanVista.\n\n4. Limitation of Liability\n- While we offer 99.99% uptime configurations, BeanVista POS is not liable for indirect revenue loss resulting from network latency, hardware disconnects, or payment processor downtime.\n\n5. Termination\n- You may cancel your subscription plan at any time. We store your catalog and inventory records for 60 days following cancellation to support easy reactivation.\n\n6. Support Contacts\nFor billing disputes or general inquiries, contact us at support@beanvista.com."),
            'faq_content' => json_decode($settingsRaw->get('faq_content', '[]'), true)
        ];

        $defaultFeatures = [
            1 => [
                'tag' => 'Real-time Kitchen Sync',
                'title' => 'Kitchen Display (KDS)',
                'desc' => 'Send orders directly to the kitchen with status updates and prep-time sorting. Eliminate paper loss.',
                'image' => 'https://cafe-animate-scroll.lovable.app/assets/kds-interface-Bm_UZdPZ.png',
                'style' => 'light'
            ],
            2 => [
                'tag' => 'Instant Checkout',
                'title' => 'Fast POS Billing',
                'desc' => 'Quick order creation, multiple payment methods, custom discounts, and taxes with automated receipt printing.',
                'image' => '/images/pos-viewer-mockup.png',
                'style' => 'dark'
            ],
            3 => [
                'tag' => 'Floor Plans & Reservations',
                'title' => 'Table Management',
                'desc' => 'Handle reservations, dine-in floor plans, split bills, and transfer orders dynamically between servers.',
                'image' => '/images/table-layout-mockup.png',
                'style' => 'orange'
            ],
            4 => [
                'tag' => 'Catalog & Pricing',
                'title' => 'Menu Management',
                'desc' => 'Easily configure categories, products, modifiers, add-ons, extras, and upload product images instantly.',
                'image' => '/images/menu-layout-mockup.png',
                'style' => 'light'
            ],
            5 => [
                'tag' => 'Ingredient Tracking',
                'title' => 'Inventory Tracking',
                'desc' => 'Recipe-linked deductions, gram-level COGS monitoring, purchase logs, and automated low-stock warnings.',
                'image' => '/images/inventory-layout-mockup.png',
                'style' => 'light'
            ],
            6 => [
                'tag' => 'User Roles',
                'title' => 'Staff Management',
                'desc' => 'Maintain cashier shifts, user roles (Admin, Kitchen, Cashier), activity tracking, and secure login controls.',
                'image' => '/images/staff-layout-mockup.png',
                'style' => 'light'
            ],
            7 => [
                'tag' => 'Business Intelligence',
                'title' => 'Reports & Analytics',
                'desc' => 'Track daily sales, margins, product performance metrics, staff leaderboards, and total revenue reports.',
                'image' => '/images/reports-layout-mockup.png',
                'style' => 'light'
            ],
            8 => [
                'tag' => 'Loyalty Rewards',
                'title' => 'Customer Management',
                'desc' => 'Build guest profiles, view transaction histories, tracks loyalty rewards, and predictive preferences.',
                'image' => '/images/customer-layout-mockup.png',
                'style' => 'light'
            ],
            9 => [
                'tag' => 'Enterprise Scale',
                'title' => 'Multi-Outlet Support',
                'desc' => 'Centralize configurations to manage multiple branches with store-wise analytics and unified reporting.',
                'image' => '/images/multi-outlet-layout-mockup.png',
                'style' => 'light'
            ]
        ];

        $settings['features_section_tag'] = $settingsRaw->get('features_section_tag', 'Complete Restaurant Operations');
        $settings['features_section_title'] = $settingsRaw->get('features_section_title', 'Streamline your counter, kitchen, and back-office.');

        for ($i = 1; $i <= 9; $i++) {
            $settings["feature_tag_$i"] = $settingsRaw->get("feature_tag_$i", $defaultFeatures[$i]['tag']);
            $settings["feature_title_$i"] = $settingsRaw->get("feature_title_$i", $defaultFeatures[$i]['title']);
            $settings["feature_desc_$i"] = $settingsRaw->get("feature_desc_$i", $defaultFeatures[$i]['desc']);
            $settings["feature_style_$i"] = $settingsRaw->get("feature_style_$i", $defaultFeatures[$i]['style']);
            
            $dbImg = $settingsRaw->get("feature_image_$i");
            $settings["feature_image_$i"] = $dbImg ? asset('storage/' . $dbImg) : $defaultFeatures[$i]['image'];
        }

        // Fetch all reviews (latest first)
        $reviews = Review::latest()->get();

        return Inertia::render('Superadmin/Cms/Index', [
            'settings' => $settings,
            'reviews' => $reviews
        ]);
    }

    /**
     * Update CMS Settings.
     */
    public function updateSettings(Request $request)
    {
        $validationRules = [
            'seo_title' => 'required|string|max:255',
            'seo_description' => 'required|string|max:1000',
            'seo_keywords' => 'nullable|string|max:1000',
            'logo' => 'nullable|image|max:2048',
            'favicon' => 'nullable|image|max:2048',
            
            'contact_email' => 'required|email|max:255',
            'contact_phone' => 'required|string|max:255',
            'contact_address' => 'required|string|max:500',
            'contact_whatsapp' => 'nullable|string|max:255',
            'playstore_url' => 'nullable|url|max:255',

            'page_about_content' => 'required|string',
            'page_privacy_content' => 'required|string',
            'page_tnc_content' => 'required|string',
            'faq_content' => 'nullable|array',

            'features_section_tag' => 'required|string|max:255',
            'features_section_title' => 'required|string|max:255',
        ];

        for ($i = 1; $i <= 9; $i++) {
            $validationRules["feature_tag_$i"] = 'required|string|max:255';
            $validationRules["feature_title_$i"] = 'required|string|max:255';
            $validationRules["feature_desc_$i"] = 'required|string|max:1000';
            $validationRules["feature_style_$i"] = 'required|string|in:light,dark,orange';
            $validationRules["feature_image_$i"] = 'nullable|image|max:2048';
        }

        $request->validate($validationRules);

        $keys = [
            'seo_title',
            'seo_description',
            'seo_keywords',
            'contact_email',
            'contact_phone',
            'contact_address',
            'contact_whatsapp',
            'playstore_url',
            'page_about_content',
            'page_privacy_content',
            'page_tnc_content',
            'features_section_tag',
            'features_section_title',
        ];

        for ($i = 1; $i <= 9; $i++) {
            $keys[] = "feature_tag_$i";
            $keys[] = "feature_title_$i";
            $keys[] = "feature_desc_$i";
            $keys[] = "feature_style_$i";
        }

        foreach ($keys as $key) {
            Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => $key, 'tenant_id' => null, 'branch_id' => null],
                ['value' => $request->input($key) ?? '', 'type' => 'text']
            );
        }

        // Handle FAQ Content as JSON
        $faqJson = json_encode($request->input('faq_content') ?? []);
        Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'faq_content', 'tenant_id' => null, 'branch_id' => null],
            ['value' => $faqJson, 'type' => 'text']
        );

        // Handle Site Logo file upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            $oldLogo = Setting::withoutGlobalScopes()
                ->whereNull('tenant_id')
                ->where('key', 'site_logo')
                ->value('value');
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }

            $path = $request->file('logo')->store('settings', 'public');
            Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => 'site_logo', 'tenant_id' => null, 'branch_id' => null],
                ['value' => $path, 'type' => 'file']
            );
        }

        // Handle Site Favicon file upload
        if ($request->hasFile('favicon')) {
            // Delete old favicon if exists
            $oldFavicon = Setting::withoutGlobalScopes()
                ->whereNull('tenant_id')
                ->where('key', 'site_favicon')
                ->value('value');
            if ($oldFavicon) {
                Storage::disk('public')->delete($oldFavicon);
            }

            $path = $request->file('favicon')->store('settings', 'public');
            Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => 'site_favicon', 'tenant_id' => null, 'branch_id' => null],
                ['value' => $path, 'type' => 'file']
            );
        }

        // Handle Feature Images uploads
        for ($i = 1; $i <= 9; $i++) {
            if ($request->hasFile("feature_image_$i")) {
                // Delete old image if exists
                $oldImg = Setting::withoutGlobalScopes()
                    ->whereNull('tenant_id')
                    ->where('key', "feature_image_$i")
                    ->value('value');
                if ($oldImg) {
                    Storage::disk('public')->delete($oldImg);
                }

                $path = $request->file("feature_image_$i")->store('settings', 'public');
                Setting::withoutGlobalScopes()->updateOrCreate(
                    ['key' => "feature_image_$i", 'tenant_id' => null, 'branch_id' => null],
                    ['value' => $path, 'type' => 'file']
                );
            }
        }

        return back()->with('success', 'CMS Settings updated successfully.');
    }

    /**
     * Approve or reject a review.
     */
    public function toggleReview(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        $review->update([
            'is_approved' => (bool) $request->is_approved
        ]);

        $status = $review->is_approved ? 'approved' : 'unapproved';
        return back()->with('success', "Review has been successfully {$status}.");
    }

    /**
     * Delete a review.
     */
    public function deleteReview($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return back()->with('success', 'Review deleted successfully.');
    }
}
