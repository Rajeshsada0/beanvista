@php
    $globalSettings = cache()->remember('global_cms_settings', 60, function () {
        return \App\Models\Setting::withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->get()
            ->pluck('value', 'key');
    });
    
    $seoTitle = $globalSettings->get('seo_title', 'BeanVista POS — Complete Cafe & Restaurant Management Solution');
    $seoDesc = $globalSettings->get('seo_description', 'BeanVista POS is a complete cafe and restaurant management system. POS billing, table reservations, KDS, inventory tracking, staff management, and analytics.');
    $seoKeywords = $globalSettings->get('seo_keywords', 'restaurant pos, cafe pos, kitchen display system, inventory tracking, staff management, loyalty rewards');
    
    $siteLogo = \App\Models\Setting::imageUrl($globalSettings->get('site_logo'));
    $siteFavicon = \App\Models\Setting::imageUrl($globalSettings->get('site_favicon'));
    
    $contactEmail = $globalSettings->get('contact_email', 'hello@cremaos.com');
    $contactPhone = $globalSettings->get('contact_phone', '+1-555-0199');
    $contactWhatsApp = $globalSettings->get('contact_whatsapp', '');
    $playstoreUrl = $globalSettings->get('playstore_url', '');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- SEO Core --}}
    <title>@yield('title', $seoTitle)</title>
    <meta name="description" content="@yield('meta_description', $seoDesc)">
    <meta name="keywords" content="@yield('meta_keywords', $seoKeywords)">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="@yield('canonical', url()->current())">

    {{-- Open Graph --}}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="BeanVista POS">
    <meta property="og:title" content="@yield('og_title', $seoTitle)">
    <meta property="og:description" content="@yield('og_description', $seoDesc)">
    <meta property="og:url" content="@yield('canonical', url()->current())">
    <meta property="og:image" content="@yield('og_image', $siteLogo ?? asset('images/og-home.png'))">

    {{-- Twitter Card --}}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@yield('og_title', $seoTitle)">
    <meta name="twitter:description" content="@yield('og_description', $seoDesc)">
    <meta name="twitter:image" content="@yield('og_image', $siteLogo ?? asset('images/og-home.png'))">

    {{-- Favicon --}}
    @if($siteFavicon)
        <link rel="icon" type="image/x-icon" href="{{ $siteFavicon }}">
    @endif

    {{-- Google Fonts --}}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700;1,800&display=swap" rel="stylesheet">

    {{-- Schema.org JSON-LD per-page --}}
    @yield('schema')

    {{-- Per-page extra head tags --}}
    @yield('head')

    <style>
@verbatim
        /* ======================================================
           CREMA.OS — Public Pages Design System
           ====================================================== */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --orange:     #ea580c;
            --orange-25:  rgba(234,88,12,.25);
            --orange-10:  rgba(234,88,12,.10);
            --s50:  #fafaf9;
            --s100: #f5f5f4;
            --s200: #e7e5e4;
            --s300: #d6d3d1;
            --s400: #a8a29e;
            --s500: #78716c;
            --s700: #44403c;
            --s900: #1c1917;
            --white:#ffffff;
            --font: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        }

        html, body {
            overflow-x: hidden;
            position: relative;
            width: 100%;
        }
        html { scroll-behavior: smooth; }
        body {
            font-family: var(--font);
            background: var(--s50);
            color: var(--s900);
            -webkit-font-smoothing: antialiased;
        }
        ::selection { background: rgba(234,88,12,.25); }

        /* Keyframes */
        @keyframes float     { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-16px)} }
        @keyframes floatSlow { 0%,100%{transform:translateY(0) rotate(8deg)} 50%{transform:translateY(-20px) rotate(12deg)} }
        @keyframes ping      { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2);opacity:0} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInR  { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }

        /* Scroll reveal */
        .reveal { opacity:0; transform:translateY(28px); transition:opacity .7s ease,transform .7s ease; }
        .reveal.visible { opacity:1; transform:translateY(0); }
        .reveal-d1{transition-delay:.12s} .reveal-d2{transition-delay:.22s}
        .reveal-d3{transition-delay:.32s} .reveal-d4{transition-delay:.44s}

        /* Layout */
        .container       { max-width:1280px; margin:0 auto; padding:0 1rem; }
        .container-tight { max-width:72rem;  margin:0 auto; padding:0 1rem; }
        .container-slim  { max-width:52rem;  margin:0 auto; padding:0 1rem; }
        @media(min-width:640px){ .container,.container-tight,.container-slim{ padding:0 1.5rem; } }

        /* Tag / eyebrow text */
        .tag {
            display:inline-block; font-family:monospace;
            font-size:.625rem; text-transform:uppercase;
            letter-spacing:.15em; color:var(--orange); margin-bottom:.875rem;
        }
        @media(min-width:640px){ .tag{ font-size:.75rem; } }

        /* Buttons */
        .btn-orange {
            display:inline-block; background:var(--orange); color:white;
            padding:.875rem 2rem; border-radius:.75rem; font-weight:700;
            text-decoration:none; transition:transform .2s,box-shadow .2s;
            box-shadow:0 20px 40px var(--orange-25);
        }
        .btn-orange:hover { transform:scale(1.05); }
        .btn-outline {
            display:inline-block; background:white; color:var(--s900);
            padding:.875rem 2rem; border-radius:.75rem; font-weight:700;
            text-decoration:none; box-shadow:inset 0 0 0 1px var(--s200);
            transition:background .2s;
        }
        .btn-outline:hover { background:var(--s100); }

        /* Nav */
        .crema-nav {
            position:fixed; top:0; left:0; right:0; z-index:50;
            transition:background .3s,border-color .3s,backdrop-filter .3s;
        }
        .crema-nav.scrolled {
            background:rgba(250,250,249,.88);
            backdrop-filter:blur(20px) saturate(1.6);
            -webkit-backdrop-filter:blur(20px) saturate(1.6);
            border-bottom:1px solid var(--s200);
        }
        .nav-inner {
            max-width:1280px; margin:0 auto; padding:0 1.5rem;
            height:4rem; display:flex; align-items:center; justify-content:space-between;
        }
        .nav-logo { display:flex; align-items:center; gap:.625rem; text-decoration:none; color:var(--s900); }
        .logo-icon {
            width:2rem; height:2rem; border-radius:.5rem; background:var(--orange);
            display:flex; align-items:center; justify-content:center;
            position:relative; overflow:hidden; flex-shrink:0;
        }
        .logo-ping {
            position:absolute; width:.75rem; height:.75rem; border-radius:50%;
            background:rgba(255,255,255,.35); animation:ping 1.8s cubic-bezier(0,0,.2,1) infinite;
        }
        .logo-dot { width:.5rem; height:.5rem; border-radius:50%; background:white; position:relative; z-index:1; }
        .logo-text { font-size:1.125rem; font-weight:800; letter-spacing:-.025em; }
        .nav-links { display:none; gap:1.75rem; align-items:center; }
        @media(min-width:768px){ .nav-links{ display:flex; } }
        .nav-links a { font-size:.875rem; font-weight:600; color:var(--s500); text-decoration:none; transition:color .2s; }
        .nav-links a:hover { color:var(--s900); }
        .nav-actions { display:flex; align-items:center; gap:1rem; }
        .btn-nav-login { font-size:.875rem; font-weight:700; color:var(--s900); text-decoration:none; transition:color .2s; }
        .btn-nav-login:hover { color:var(--orange); }
        .btn-nav-cta {
            background:var(--s900); color:white; padding:.5rem 1.25rem;
            border-radius:999px; font-size:.8125rem; font-weight:600;
            text-decoration:none; transition:background .2s; white-space:nowrap;
        }
        .btn-nav-cta:hover { background:var(--orange); }

        @media(max-width: 767px) {
            .nav-actions .btn-nav-cta { display: none; }
        }
        @media(max-width: 480px) {
            .nav-actions .btn-nav-login { display: none; }
        }

        /* Mobile hamburger styles */
        .nav-mobile-toggle {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            width: 1.5rem;
            height: 1.125rem;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            z-index: 60;
        }
        @media(min-width: 768px) {
            .nav-mobile-toggle { display: none; }
        }
        .nav-mobile-toggle .bar {
            width: 100%;
            height: 2.5px;
            background-color: var(--s900);
            border-radius: 99px;
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
            transform-origin: center;
        }
        .nav-mobile-toggle.open .bar:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .nav-mobile-toggle.open .bar:nth-child(2) { opacity: 0; }
        .nav-mobile-toggle.open .bar:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

        /* Mobile drawer overlay */
        .nav-overlay {
            position: fixed;
            inset: 0;
            background: rgba(28, 25, 23, 0.5);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 99;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease;
        }
        .nav-overlay.open {
            opacity: 1;
            visibility: visible;
        }

        /* Mobile menu drawer */
        .nav-mobile-menu {
            position: fixed;
            top: 0;
            right: 0;
            width: 85vw;
            max-width: 340px;
            height: 100vh;
            height: 100dvh;
            background: var(--white);
            border-left: 1px solid var(--s200);
            z-index: 100;
            display: flex;
            flex-direction: column;
            box-shadow: -12px 0 35px rgba(0, 0, 0, 0.12);
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            visibility: hidden;
            padding-top: max(0rem, env(safe-area-inset-top));
            padding-bottom: max(0rem, env(safe-area-inset-bottom));
        }
        .nav-mobile-menu.open {
            transform: translateX(0);
            visibility: visible;
        }
        .mobile-menu-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--s100);
            background: var(--s50);
            flex-shrink: 0;
        }
        .mobile-menu-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 50%;
            background: var(--s100);
            color: var(--s900);
            border: none;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
        }
        .mobile-menu-close:hover {
            background: var(--s200);
            color: var(--orange);
        }
        .mobile-menu-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 1.25rem 1.5rem 2rem;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }
        .mobile-menu-nav {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .mobile-menu-nav a {
            font-size: 1rem;
            font-weight: 700;
            color: var(--s900);
            text-decoration: none;
            padding: 0.75rem 0.5rem;
            border-radius: 0.5rem;
            border-bottom: 1px solid var(--s100);
            transition: background 0.2s, color 0.2s;
        }
        .mobile-menu-nav a:last-child {
            border-bottom: none;
        }
        .mobile-menu-nav a:hover,
        .mobile-menu-nav a:focus {
            background: var(--s50);
            color: var(--orange);
        }
        .mobile-menu-actions {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding-top: 1rem;
            border-top: 1px solid var(--s200);
        }

        /* Responsive general optimization card padding */
        @media(max-width: 640px) {
            .info-card, .contact-form-card, .about-card, .policy-card, .write-card {
                padding: 1.5rem !important;
            }
        }

        /* Footer */
        .crema-footer { border-top:1px solid var(--s200); padding:2.5rem 0; }
        .footer-inner {
            display:flex; flex-direction:column;
            align-items:center; gap:1.5rem; text-align:center;
        }
        @media(min-width:768px){
            .footer-inner{ flex-direction:row; justify-content:space-between; text-align:left; }
        }
        .footer-logo { display:flex; align-items:center; gap:.5rem; }
        .footer-logo-box { width:1.5rem; height:1.5rem; border-radius:.25rem; background:var(--s900); }
        .footer-logo-txt { font-weight:700; letter-spacing:-.025em; }
        .footer-links { display:flex; flex-wrap:wrap; justify-content:center; gap:0.75rem 1.5rem; }
        .footer-links a {
            font-family:monospace; font-size:.75rem; text-transform:uppercase;
            letter-spacing:.1em; color:var(--s500); text-decoration:none; transition:color .2s;
        }
        .footer-links a:hover { color:var(--orange); }
        .footer-copy { font-family:monospace; font-size:.625rem; color:var(--s500); }

        /* FAQ */
        .faq-list { border:1px solid var(--s200); border-radius:1.25rem; overflow:hidden; }
        .faq-item { border-bottom:1px solid var(--s200); }
        .faq-item:last-child { border-bottom:none; }
        .faq-btn {
            width:100%; text-align:left; padding:1.25rem 1.5rem; background:none;
            border:none; cursor:pointer; display:flex; align-items:center;
            justify-content:space-between; gap:1rem; font-size:1rem; font-weight:700;
            color:var(--s900); font-family:var(--font); transition:background .15s;
        }
        .faq-btn:hover { background:var(--s50); }
        .faq-icon {
            width:1.5rem; height:1.5rem; border-radius:50%; background:var(--s100);
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
            transition:background .2s,transform .3s;
        }
        .faq-item.open .faq-icon { background:var(--orange); transform:rotate(45deg); }
        .faq-icon svg { width:.75rem; height:.75rem; stroke:var(--s500); transition:stroke .2s; }
        .faq-item.open .faq-icon svg { stroke:white; }
        .faq-body { display:none; padding:0 1.5rem 1.25rem; color:var(--s500); line-height:1.75; font-size:.9375rem; }
        .faq-item.open .faq-body { display:block; }
@endverbatim
    </style>
</head>
<body>

<nav class="crema-nav" id="mainNav" aria-label="Main navigation">
    <div class="nav-inner">
        <a href="{{ route('home') }}" class="nav-logo" aria-label="BeanVista POS Home">
            @if($siteLogo)
                <img src="{{ $siteLogo }}" alt="BeanVista POS Logo" style="height:2rem; width:auto; object-fit:contain;" />
            @else
                <div class="logo-icon">
                    <div class="logo-ping"></div>
                    <div class="logo-dot"></div>
                </div>
                <span class="logo-text">BeanVista POS</span>
            @endif
        </a>
        <nav class="nav-links" aria-label="Site sections">
            <a href="{{ route('home') }}#features">Features</a>
            <a href="{{ route('home') }}#pricing">Pricing</a>
            <a href="{{ route('home') }}#faq">FAQ</a>
            <a href="{{ route('docs') }}">Docs</a>
            <a href="{{ route('about') }}">About</a>
            <a href="{{ route('reviews') }}">Reviews</a>
            <a href="{{ route('contact') }}">Contact</a>
        </nav>
        <div class="nav-actions">
            @auth
                <a href="{{ route('dashboard') }}" class="btn-nav-login">Dashboard &rarr;</a>
            @else
                <a href="{{ route('login') }}" class="btn-nav-login">Log in</a>
                <a href="{{ route('book-demo') }}" class="btn-nav-cta">Book Demo</a>
            @endauth
            
            <button class="nav-mobile-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
            </button>
        </div>
    </div>
</nav>

<div class="nav-overlay" id="navOverlay" aria-hidden="true"></div>
<div class="nav-mobile-menu" id="mobileMenu" aria-label="Mobile navigation menu" role="dialog" aria-modal="true">
    <div class="mobile-menu-header">
        <a href="{{ route('home') }}" class="nav-logo" aria-label="BeanVista POS Home">
            @if($siteLogo)
                <img src="{{ $siteLogo }}" alt="BeanVista POS Logo" style="height:1.75rem; width:auto; object-fit:contain;" />
            @else
                <div class="logo-icon" style="width:1.75rem; height:1.75rem;">
                    <div class="logo-ping"></div>
                    <div class="logo-dot"></div>
                </div>
                <span class="logo-text" style="font-size:1rem;">BeanVista POS</span>
            @endif
        </a>
        <button class="mobile-menu-close" id="navClose" aria-label="Close navigation menu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    </div>
    <div class="mobile-menu-body">
        <nav class="mobile-menu-nav" aria-label="Mobile navigation links">
            <a href="{{ route('home') }}#features">Features</a>
            <a href="{{ route('home') }}#pricing">Pricing</a>
            <a href="{{ route('home') }}#faq">FAQ</a>
            <a href="{{ route('docs') }}">Docs</a>
            <a href="{{ route('about') }}">About</a>
            <a href="{{ route('reviews') }}">Reviews</a>
            <a href="{{ route('contact') }}">Contact</a>
        </nav>
        <div class="mobile-menu-actions">
            @auth
                <a href="{{ route('dashboard') }}" class="btn-orange" style="text-align:center;">Dashboard &rarr;</a>
            @else
                <a href="{{ route('login') }}" class="btn-nav-login" style="text-align:center; padding: 0.625rem 0;">Log in</a>
                <a href="{{ route('book-demo') }}" class="btn-orange" style="text-align:center; margin-bottom: 0.5rem;">Book Demo</a>
                @if($playstoreUrl)
                    <a href="{{ $playstoreUrl }}" target="_blank" rel="noopener" class="btn-outline" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; text-align: center; width: 100%;">
                        <svg viewBox="0 0 512 512" style="width: 1rem; height: 1rem; fill: var(--orange); flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg">
                            <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.3-60.7-60.7 60.1-60.1 58.6 33.6c24.8 14.2 24.8 59.7 0 73.9zm-225 30.4L104.6 499l280.8-161.2-60.7-60.7-60.1 59.9z"/>
                        </svg>
                        <span>Google Play</span>
                    </a>
                @endif
            @endauth
        </div>
    </div>
</div>

@yield('content')

<footer class="crema-footer">
    <div class="container">
        <div class="footer-inner">
            <div class="footer-logo">
                @if($siteLogo)
                    <img src="{{ $siteLogo }}" alt="BeanVista POS Logo" style="height:1.5rem; width:auto; object-fit:contain;" />
                @else
                    <div class="footer-logo-box" aria-hidden="true"></div>
                    <span class="footer-logo-txt">BeanVista POS</span>
                @endif
            </div>
            <nav class="footer-links" aria-label="Footer">
                <a href="{{ route('home') }}#faq">FAQ</a>
                <a href="{{ route('docs') }}">Docs</a>
                <a href="{{ route('about') }}">About</a>
                <a href="{{ route('reviews') }}">Reviews</a>
                <a href="{{ route('contact') }}">Contact</a>
                <a href="{{ route('privacy') }}">Privacy Policy</a>
                <a href="{{ route('terms') }}">T&amp;C</a>
            </nav>
            @if($playstoreUrl)
                <div class="footer-playstore" style="margin: 0.5rem 0;">
                    <a href="{{ $playstoreUrl }}" target="_blank" rel="noopener" aria-label="Get it on Google Play">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" style="height: 2.25rem; width: auto; display: block;" />
                    </a>
                </div>
            @endif
            <p class="footer-copy">&copy; {{ date('Y') }} BeanVista POS. All rights reserved.</p>
        </div>
    </div>
</footer>

<script>
(function(){
    'use strict';
    // Sticky nav
    var nav = document.getElementById('mainNav');
    window.addEventListener('scroll', function(){ nav.classList.toggle('scrolled', window.scrollY > 20); }, { passive: true });
    
    // Mobile Navigation Drawer Toggle
    var navToggle = document.getElementById('navToggle');
    var navClose = document.getElementById('navClose');
    var mobileMenu = document.getElementById('mobileMenu');
    var navOverlay = document.getElementById('navOverlay');
    
    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('open');
        if (navOverlay) navOverlay.classList.add('open');
        if (navToggle) {
            navToggle.classList.add('open');
            navToggle.setAttribute('aria-expanded', 'true');
        }
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('open');
        if (navToggle) {
            navToggle.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    function toggleMobileMenu() {
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
    
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
    if (navClose) {
        navClose.addEventListener('click', closeMobileMenu);
    }
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close menu when pressing Escape key
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        }
    });

    // Close menu on screen resize if moving to desktop width
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768 && mobileMenu && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        }
    }, { passive: true });

    // Close menu when any drawer link is clicked
    if (mobileMenu) {
        var mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(function(link) {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // Scroll reveal
    var els = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && els.length) {
        var io = new IntersectionObserver(function(entries){
            entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } });
        }, { threshold: 0.08, rootMargin: '-50px 0px' });
        els.forEach(function(el){ io.observe(el); });
    } else { els.forEach(function(el){ el.classList.add('visible'); }); }
    // FAQ accordion
    document.querySelectorAll('.faq-item').forEach(function(item){
        item.querySelector('.faq-btn').addEventListener('click', function(){
            var open = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(function(i){
                i.classList.remove('open');
                i.querySelector('.faq-btn').setAttribute('aria-expanded','false');
            });
            if(!open){ item.classList.add('open'); item.querySelector('.faq-btn').setAttribute('aria-expanded','true'); }
        });
    });
})();
</script>

@yield('scripts')
</body>
</html>
