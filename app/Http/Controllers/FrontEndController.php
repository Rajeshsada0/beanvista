<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Review;
use Illuminate\Http\Request;

class FrontEndController extends Controller
{
    /**
     * Get all global settings.
     */
    protected function getGlobalSettings()
    {
        return Setting::withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->pluck('value', 'key');
    }

    /**
     * Home Page.
     */
    public function home()
    {
        $settings = $this->getGlobalSettings();
        
        // Decode FAQ JSON or fallback to defaults
        $faqJson = $settings->get('faq_content');
        $faqs = [];
        if ($faqJson) {
            $faqs = json_decode($faqJson, true);
        }
        
        if (empty($faqs)) {
            $faqs = [
                ['What is BeanVista POS?', 'BeanVista POS is an all-in-one cafe management platform combining a point-of-sale system, kitchen display system (KDS), inventory management, customer loyalty rewards, and table booking — all in one dashboard.'],
                ['How long does setup take?', 'Most cafes go live in under 60 minutes. Our onboarding imports your existing menu and we provide a dedicated setup specialist for your first shift.'],
                ['Can I try BeanVista POS for free?', 'Yes. We offer a full 30-day free trial with no credit card required. You get access to all Professional plan features during your trial.'],
                ['Does BeanVista POS work for multi-branch cafes?', 'Absolutely. Our Professional and Enterprise plans support multiple branches with a centralized dashboard for cross-location reporting, inventory, and staff management.'],
                ['What payment methods does BeanVista POS support?', 'BeanVista POS supports tap-to-pay, QR code payments, cash, split tender, and credit/debit cards across 28 markets at a flat 0.5% rate.']
            ];
        }

        return view('frontend.home', compact('settings', 'faqs'));
    }

    /**
     * About Page.
     */
    public function about()
    {
        $settings = $this->getGlobalSettings();
        return view('frontend.about', compact('settings'));
    }

    /**
     * Contact Page.
     */
    public function contact()
    {
        $settings = $this->getGlobalSettings();
        return view('frontend.contact', compact('settings'));
    }

    /**
     * Privacy Policy Page.
     */
    public function privacy()
    {
        $settings = $this->getGlobalSettings();
        return view('frontend.privacy', compact('settings'));
    }

    /**
     * Terms & Conditions Page.
     */
    public function terms()
    {
        $settings = $this->getGlobalSettings();
        return view('frontend.terms', compact('settings'));
    }

    /**
     * Reviews Page.
     */
    public function reviews()
    {
        $settings = $this->getGlobalSettings();
        
        $reviews = Review::where('is_approved', true)->latest()->get();
        $totalReviews = $reviews->count();
        $averageRating = $totalReviews > 0 ? round($reviews->avg('rating'), 1) : 0.0;
        
        // Count breakdown
        $ratingCounts = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        foreach ($reviews as $review) {
            $r = (int)$review->rating;
            if (isset($ratingCounts[$r])) {
                $ratingCounts[$r]++;
            }
        }

        return view('frontend.reviews', compact('settings', 'reviews', 'totalReviews', 'averageRating', 'ratingCounts'));
    }

    /**
     * Submit a Review.
     */
    public function submitReview(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        Review::create([
            'name' => $request->name,
            'email' => $request->email,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'is_approved' => false // needs superadmin approval
        ]);

        return back()->with('success', 'Thank you! Your review has been submitted for approval.');
    }

    /**
     * Documentation Page.
     */
    public function docs()
    {
        $settings = $this->getGlobalSettings();
        return view('frontend.docs', compact('settings'));
    }
}
