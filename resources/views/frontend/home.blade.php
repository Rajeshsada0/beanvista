@extends('frontend')

@section('title', 'BeanVista POS — Complete Cafe & Restaurant Management Solution | POS, KDS & Inventory')
@section('meta_description', 'BeanVista POS is the complete cafe & restaurant management system. Run your POS billing, kitchen display system (KDS), inventory, table reservations, and reports from one easy-to-use app.')
@section('canonical', url('/'))
@section('og_title', 'BeanVista POS — Cafe & Restaurant Management System')
@section('og_description', 'POS billing, table management, KDS, inventory, staff management, and analytics — designed for growing cafes and restaurants. Start your free trial.')

@section('schema')
<script type="application/ld+json">
{
  "@@context": "https://schema.org",
  "@@graph": [
    {
      "@@type": "SoftwareApplication",
      "name": "BeanVista POS",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android, Windows",
      "description": "Complete cafe & restaurant management solution with POS billing, table reservations, kitchen display system, inventory tracking, staff management, and analytics.",
      "url": "{{ url('/') }}",
      "offers": [
        { "@@type": "Offer", "name": "Starter",      "price": "49",  "priceCurrency": "USD" },
        { "@@type": "Offer", "name": "Professional", "price": "129", "priceCurrency": "USD" }
      ],
      "aggregateRating": {
        "@@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "412",
        "bestRating": "5"
      }
    },
    {
      "@@type": "FAQPage",
      "mainEntity": [
        {
          "@@type": "Question",
          "name": "What is BeanVista POS?",
          "acceptedAnswer": { "@@type": "Answer", "text": "BeanVista POS is a complete cafe and restaurant management platform combining point-of-sale billing, table management, kitchen display system (KDS), inventory tracking, and staff management in one unified dashboard." }
        },
        {
          "@@type": "Question",
          "name": "How long does setup take?",
          "acceptedAnswer": { "@@type": "Answer", "text": "Most cafes and restaurants go live in under 60 minutes. Our onboarding imports your existing menu and we provide a dedicated setup specialist for your first shift." }
        },
        {
          "@@type": "Question",
          "name": "Can I try BeanVista POS for free?",
          "acceptedAnswer": { "@@type": "Answer", "text": "Yes. We offer a full 30-day free trial with no credit card required. You get access to all Professional plan features during your trial." }
        },
        {
          "@@type": "Question",
          "name": "Does BeanVista POS work for multi-branch outlets?",
          "acceptedAnswer": { "@@type": "Answer", "text": "Absolutely. Our Professional and Enterprise plans support multiple branches with a centralized dashboard for cross-location reporting, inventory, and staff management." }
        },
        {
          "@@type": "Question",
          "name": "What payment methods does BeanVista POS support?",
          "acceptedAnswer": { "@@type": "Answer", "text": "BeanVista POS supports tap-to-pay, QR code payments, cash, split tender, and credit/debit cards across 28 markets at a flat 0.5% rate." }
        }
      ]
    }
  ]
}
</script>
@endsection

@section('head')
<style>
@verbatim
/* ── Hero ─────────────────────────────────────────── */
.hero { padding: 5.5rem 0 4rem; overflow: hidden; }
@media(min-width:640px){ .hero{ padding:7.5rem 0 7rem; } }
@media(min-width:1024px){ .hero{ padding:9.5rem 0 7rem; } }
.hero-grid { display:grid; align-items:center; gap:2.5rem; }
@media(min-width:1024px){ .hero-grid{ grid-template-columns:1fr 1fr; gap:3rem; } }
.hero-badge { display:block; font-family:monospace; font-size:.625rem; text-transform:uppercase; letter-spacing:.15em; color:var(--orange); margin-bottom:1rem; }
.hero-h1 { font-size:clamp(2.25rem,8vw,6rem); font-weight:900; line-height:.92; letter-spacing:-.04em; margin-bottom:1.5rem; }
.hero-h1 em { font-style:normal; color:var(--orange); }
.hero-p { font-size:1.0625rem; color:var(--s500); max-width:44ch; line-height:1.65; margin-bottom:2rem; }
@media(min-width:640px){ .hero-p{ font-size:1.1875rem; } }
.hero-btns { display:flex; flex-wrap:wrap; gap:.75rem; margin-bottom:2.5rem; }
.hero-stats { display:flex; gap:2rem; padding-top:1.5rem; border-top:1px solid var(--s200); }
.stat-val { font-size:1.25rem; font-weight:800; letter-spacing:-.03em; }
.stat-lbl { font-family:monospace; font-size:.625rem; text-transform:uppercase; letter-spacing:.12em; color:var(--s500); margin-top:.2rem; }

/* ── Hero visual ─────────────────────────────────── */
.hero-visual { position:relative; height:380px; display:flex; align-items:center; justify-content:center; }
@media(min-width:640px){ .hero-visual{ height:520px; } }
@media(min-width:1024px){ .hero-visual{ height:620px; } }
.hero-glow { position:absolute; width:280px; height:280px; border-radius:50%; background:rgba(234,88,12,.15); filter:blur(60px); pointer-events:none; }
@media(min-width:640px){ .hero-glow{ width:420px; height:420px; } }
.hero-tablet { position:absolute; z-index:0; transform:translate(-4rem,5rem); }
@media(min-width:640px){ .hero-tablet{ transform:translate(-7rem,8rem); } }
.hero-tablet-wrap { width:220px; overflow:hidden; border-radius:1rem; background:var(--s900); box-shadow:0 25px 50px rgba(0,0,0,.35); }
@media(min-width:640px){ .hero-tablet-wrap{ width:320px; } }
.hero-tablet-wrap img { width:100%; height:auto; display:block; aspect-ratio:4/3; object-fit:cover; }
.hero-coffee { position:absolute; z-index:20; }
.hero-coffee img { width:220px; filter:drop-shadow(0 40px 50px rgba(0,0,0,.35)); animation:floatSlow 8s ease-in-out infinite 1s; }
@media(min-width:640px){ .hero-coffee img{ width:320px; } }
.hero-croissant { position:absolute; z-index:10; transform:translate(6rem,-5rem); }
@media(min-width:640px){ .hero-croissant{ transform:translate(10rem,-7rem); } }
.hero-croissant img { width:140px; filter:drop-shadow(0 30px 40px rgba(0,0,0,.3)); animation:float 5s ease-in-out infinite 2s; }
@media(min-width:640px){ .hero-croissant img{ width:200px; } }

@media(max-width: 640px) {
    .hero-visual { height: 280px; }
    .hero-tablet { transform: translate(-3.5rem, 3rem); }
    .hero-tablet-wrap { width: 150px; }
    .hero-coffee { transform: translate(0.5rem, 0.5rem); }
    .hero-coffee img { width: 150px; }
    .hero-croissant { transform: translate(4.5rem, -3.5rem); }
    .hero-croissant img { width: 100px; }
}

/* ── Features ────────────────────────────────────── */
.features-sec { border-top:1px solid var(--s200); border-bottom:1px solid var(--s200); background:rgba(255,255,255,.6); padding:5rem 0; }
@media(min-width:640px){ .features-sec{ padding:6rem 0; } }
.sec-h2 { font-size:clamp(1.875rem,4vw,3rem); font-weight:900; letter-spacing:-.04em; line-height:1.1; }
.feat-grid { display:grid; grid-template-columns:1fr; gap:1rem; }
@media(min-width:768px){ .feat-grid{ grid-template-columns:repeat(3,1fr); gap:1.5rem; } }
.fc { background:white; border-radius:1.5rem; padding:1.5rem 1.5rem 0; border:1px solid var(--s200); transition:border-color .2s; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; min-height:380px; }
.fc:hover { border-color:var(--s300); }
.fc-lg { display:flex; flex-direction:column; justify-content:space-between; position:relative; }
@media(min-width:640px){
    .fc { padding:2rem 2rem 0; min-height:440px; }
}
.fc-dark { background:var(--s900); color:white; }
.fc-orange { background:var(--orange); color:white; }
.fc h3 { font-size:1.25rem; font-weight:800; letter-spacing:-.03em; margin-bottom:.5rem; }
@media(min-width:640px){ .fc h3{ font-size:1.5rem; } }
.fc-img { margin-top:1.5rem; transform:translateY(2rem); transition:transform .5s cubic-bezier(0.16, 1, 0.3, 1); }
.fc:hover .fc-img { transform:translateY(.5rem); }
.fc-img img { width:100%; border-radius:.75rem .75rem 0 0; border:1px solid var(--s200); height:10rem; object-fit:cover; }
@media(min-width:640px){ .fc-img img{ height:12rem; } }
.fc-icon { width:3rem; height:3rem; border-radius:.75rem; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:center; }
.fc-spinner { width:1.5rem; height:1.5rem; border-radius:50%; border:2px solid white; border-top-color:transparent; animation:spin 1s linear infinite; }
.fc-mini { min-height:0; }

/* ── Scrolling menu ──────────────────────────────── */
.menu-sec { padding:6rem 0; }
@media(min-width:640px){ .menu-sec{ padding:8rem 0; } }
.menu-items { display:flex; flex-direction:column; gap:5rem; }
@media(min-width:640px){ .menu-items{ gap:9rem; } }
.menu-row { display:grid; align-items:center; gap:2rem; }
@media(min-width:768px){ 
    .menu-row{ grid-template-columns:1fr 1fr; gap:3rem; } 
    .menu-row.rev .menu-visual { order:2; }
    .menu-row.rev .menu-text  { order:1; }
}
.menu-visual { position:relative; height:280px; display:flex; align-items:center; justify-content:center; }
@media(min-width:640px){ .menu-visual{ height:420px; } }
@media(min-width:768px){ .menu-visual{ height:500px; } }
.menu-glow { position:absolute; inset:0; margin:auto; width:220px; height:220px; border-radius:50%; background:var(--orange); opacity:.35; filter:blur(60px); }
@media(min-width:640px){ .menu-glow{ width:320px; height:320px; } }
.menu-img-el { position:relative; width:220px; max-width:100%; height:auto; filter:drop-shadow(0 40px 55px rgba(0,0,0,.22)); transition:transform .5s; }
@media(min-width:640px){ .menu-img-el{ width:310px; } }
@media(min-width:768px){ .menu-img-el{ width:420px; } }
.menu-img-el:hover { transform:scale(1.05) translateY(-1rem); }
.menu-text { text-align:center; }
@media(min-width:768px){ .menu-text{ text-align:left; } }
.menu-h3 { font-size:clamp(2rem,5vw,3.25rem); font-weight:900; letter-spacing:-.04em; margin-bottom:1rem; }
.menu-p { font-size:1.0625rem; color:var(--s500); max-width:38ch; margin:0 auto; line-height:1.65; }
@media(min-width:768px){ .menu-p{ margin:0; } }

/* ── Pricing ─────────────────────────────────────── */
.pricing-sec { padding:6rem 0; }
@media(min-width:640px){ .pricing-sec{ padding:8rem 0; } }
.price-grid { display:grid; grid-template-columns:1fr; gap:1.5rem; align-items:stretch; margin-top:1rem; }
@media(min-width:768px){ .price-grid{ grid-template-columns:repeat(3,1fr); } }
.pc { border-radius:1.5rem; padding:1.5rem; border:1px solid var(--s200); background:white; display:flex; flex-direction:column; }
@media(min-width:640px){ .pc{ padding:2rem; } }
.pc-feat { background:var(--s900); color:white; border-color:var(--s900); box-shadow:0 25px 50px rgba(28,25,23,.2); position:relative; }
@media(min-width:768px){ .pc-feat{ transform:scale(1.03); } }
.pc-badge { position:absolute; top:-.75rem; left:50%; transform:translateX(-50%); background:var(--orange); color:white; font-size:.625rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em; padding:.25rem 1rem; border-radius:999px; white-space:nowrap; }
.pc-tier { font-family:monospace; font-size:.75rem; color:var(--s500); margin-bottom:1rem; }
.pc-feat .pc-tier { color:rgba(255,255,255,.55); }
.pc-price { font-size:3rem; font-weight:900; letter-spacing:-.04em; margin-bottom:.25rem; }
.pc-period { font-size:.875rem; font-weight:400; color:var(--s500); }
.pc-feat .pc-period { color:rgba(255,255,255,.55); }
.pc-bill { font-size:.75rem; color:var(--s500); margin-bottom:2rem; }
.pc-feat .pc-bill { color:rgba(255,255,255,.55); }
.pc-feats { list-style:none; flex:1; margin-bottom:2rem; display:flex; flex-direction:column; gap:.75rem; }
.pc-feats li { display:flex; align-items:flex-start; gap:.5rem; font-size:.9375rem; color:var(--s500); }
.pc-feat .pc-feats li { color:rgba(255,255,255,.85); }
.pc-feats li::before { content:'●'; color:var(--orange); margin-top:.1rem; flex-shrink:0; font-size:.5rem; }
.pc-btn { display:block; text-align:center; padding:.75rem 1rem; border-radius:.75rem; font-weight:700; text-decoration:none; transition:all .2s; border:1px solid var(--s200); color:var(--s900); }
.pc-btn:hover { background:var(--s50); }
.pc-btn-feat { background:var(--orange); color:white; border-color:var(--orange); }
.pc-btn-feat:hover { opacity:.9; }

/* ── FAQ ─────────────────────────────────────────── */
.faq-sec { background:white; border-top:1px solid var(--s200); padding:6rem 0; }
@media(min-width:640px){ .faq-sec{ padding:8rem 0; } }

/* ── CTA ─────────────────────────────────────────── */
.cta-sec { padding:5rem 1rem; }
@media(min-width:640px){ .cta-sec{ padding:6rem 1.5rem; } }
.cta-wrap { max-width:1280px; margin:0 auto; position:relative; overflow:hidden; border-radius:2rem; background:var(--s900); padding:3rem 2rem; text-align:center; color:white; }
@media(min-width:640px){ .cta-wrap{ border-radius:2.5rem; padding:4rem 3rem; } }
@media(min-width:768px){ .cta-wrap{ padding:5rem; } }
.cta-glow1 { position:absolute; inset:0; background:rgba(234,88,12,.15); filter:blur(120px); animation:pulse 3s ease-in-out infinite; }
.cta-glow2 { position:absolute; right:-5rem; top:-5rem; width:20rem; height:20rem; border-radius:50%; background:rgba(234,88,12,.3); filter:blur(60px); }
.cta-body { position:relative; z-index:10; }
.cta-h2 { font-size:clamp(2.25rem,7vw,4.5rem); font-weight:900; letter-spacing:-.04em; line-height:1; margin-bottom:2rem; }
.cta-btn { display:inline-block; background:white; color:var(--s900); padding:1rem 3rem; border-radius:999px; font-weight:700; text-decoration:none; font-size:1.0625rem; transition:all .2s; }
.cta-btn:hover { background:var(--orange); color:white; transform:scale(1.05); }
.cta-note { margin-top:2rem; font-family:monospace; font-size:.75rem; color:rgba(255,255,255,.4); }

/* Perfect For Section */
.perfect-sec { padding: 5rem 0; border-top: 1px solid var(--s200); background: var(--s50); }
.perfect-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.875rem; max-width: 54rem; margin: 0 auto; }
.perfect-pill {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    background: white;
    border: 1px solid var(--s200);
    border-radius: 99px;
    padding: 0.75rem 1.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--s900);
    box-shadow: 0 4px 12px rgba(0,0,0,0.01);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.perfect-pill:hover {
    border-color: var(--orange);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px var(--orange-25);
}
.perfect-icon { font-size: 1.125rem; }

/* Why Choose Us Section */
.why-sec { padding: 6rem 0; border-top: 1px solid var(--s200); border-bottom: 1px solid var(--s200); background: white; }
.why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
.why-card {
    background: var(--s50);
    border: 1px solid var(--s200);
    border-radius: 1.5rem;
    padding: 2rem;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.why-card:hover {
    background: white;
    border-color: var(--orange);
    transform: translateY(-4px);
    box-shadow: 0 12px 30px var(--orange-10);
}
.why-icon { font-size: 2rem; margin-bottom: 1.25rem; }
.why-title { font-size: 1.25rem; font-weight: 800; color: var(--s900); margin-bottom: 0.5rem; }
.why-desc { font-size: 0.9375rem; color: var(--s500); line-height: 1.6; }
@endverbatim
</style>
@endsection

@section('content')
<main>

{{-- ── HERO ──────────────────────────────────────── --}}
<section class="hero" aria-label="Hero">
    <div class="container">
        <div class="hero-grid">
            <div style="animation:fadeInUp .8s ease both">
                <span class="hero-badge">BeanVista POS &mdash; Retail POS Solution</span>
                <h1 class="hero-h1">
                    Manage Your<br>
                    <em>Entire</em> Cafe &amp; Shop.
                </h1>
                <p class="hero-p">
                    BeanVista POS is the complete point-of-sale and restaurant management system designed for cafés, bakeries, coffee shops, and quick-service operations.
                </p>
                <div class="hero-btns">
                    <a href="{{ route('start-trial') }}" class="btn-orange">Start Free Trial</a>
                    <a href="{{ route('book-demo') }}" class="btn-outline">Book a Demo</a>
                    @if($settings->get('playstore_url'))
                        <a href="{{ $settings->get('playstore_url') }}" target="_blank" rel="noopener" class="btn-outline" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.5rem;">
                            <svg viewBox="0 0 512 512" style="width: 1rem; height: 1rem; fill: var(--orange); flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg">
                                <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58 33.3-60.7-60.7 60.1-60.1 58.6 33.6c24.8 14.2 24.8 59.7 0 73.9zm-225 30.4L104.6 499l280.8-161.2-60.7-60.7-60.1 59.9z"/>
                            </svg>
                            <span>Google Play</span>
                        </a>
                    @endif
                </div>
                <div class="hero-stats">
                    <div><div class="stat-val">4,000+</div><div class="stat-lbl">Outlets</div></div>
                    <div><div class="stat-val">99.99%</div><div class="stat-lbl">Uptime</div></div>
                    <div><div class="stat-val">28</div><div class="stat-lbl">Countries</div></div>
                </div>
            </div>

            <div class="hero-visual" aria-hidden="true" style="animation:fadeInUp 1s .2s ease both">
                <div class="hero-glow"></div>
                <div class="hero-tablet">
                    <div class="hero-tablet-wrap">
                        <img src="https://cafe-animate-scroll.lovable.app/assets/kds-interface-Bm_UZdPZ.png"
                             alt="Kitchen display system interface" width="320" height="240" loading="eager">
                    </div>
                </div>
                <div class="hero-coffee">
                    <img src="https://cafe-animate-scroll.lovable.app/assets/3d-espresso-cup-C8Cnw9Hy.png"
                         alt="3D espresso cup" width="320" height="320" loading="eager">
                </div>
                <div class="hero-croissant">
                    <img src="https://cafe-animate-scroll.lovable.app/assets/3d-croissant-TEgu43Fl.png"
                         alt="3D croissant" width="200" height="200" loading="lazy">
                </div>
            </div>
        </div>
    </div>
</section>

{{-- ── FEATURES ─────────────────────────────────── --}}
<section id="features" class="features-sec" aria-labelledby="feat-heading">
    <div class="container">
        <div class="reveal" style="margin-bottom:3rem; max-width:44rem;">
            <span class="tag">{{ $settings['features_section_tag'] ?? 'Complete Restaurant Operations' }}</span>
            <h2 class="sec-h2" id="feat-heading">{{ $settings['features_section_title'] ?? 'Streamline your counter, kitchen, and back-office.' }}</h2>
        </div>

        <div class="feat-grid">
            @for($i = 1; $i <= 9; $i++)
                @php
                    $fTag   = $settings["feature_tag_$i"] ?? '';
                    $fTitle = $settings["feature_title_$i"] ?? '';
                    $fDesc  = $settings["feature_desc_$i"] ?? '';
                    $fStyle = $settings["feature_style_$i"] ?? 'light';
                    
                    $fImg   = $settings["feature_image_$i"] ?? '';
                    if ($fImg && !str_starts_with($fImg, 'http') && !str_starts_with($fImg, '/images') && !str_starts_with($fImg, '/img')) {
                        $fImg = route('media.serve', ['path' => $fImg]);
                    }
                    
                    $cardClass = 'fc';
                    if ($fStyle === 'dark') {
                        $cardClass .= ' fc-dark';
                    } elseif ($fStyle === 'orange') {
                        $cardClass .= ' fc-orange';
                    }
                @endphp
                <article class="{{ $cardClass }} reveal reveal-d{{ ($i % 3) + 1 }}" id="feature-{{ $i }}">
                    <div>
                        <span class="tag" style="{{ $fStyle === 'orange' ? 'color:white; opacity:0.8;' : ($fStyle === 'dark' ? 'color:var(--orange);' : '') }}">{{ $fTag }}</span>
                        <h3>{{ $fTitle }}</h3>
                        <p style="{{ $fStyle === 'orange' ? 'color:rgba(255,255,255,.9);' : ($fStyle === 'dark' ? 'color:var(--s400);' : 'color:var(--s500);') }} line-height:1.6">{{ $fDesc }}</p>
                    </div>
                    @if($fImg)
                        <div class="fc-img">
                            <img src="{{ $fImg }}"
                                 alt="{{ $fTitle }} preview" width="640" height="208" loading="lazy"
                                 style="{{ $fStyle === 'orange' ? 'border-color:rgba(255,255,255,.15)' : ($fStyle === 'dark' ? 'border-color:rgba(255,255,255,.1)' : '') }}">
                        </div>
                    @endif
                </article>
            @endfor
        </div>
    </div>
</section>

{{-- ── PERFECT FOR ───────────────────────────────── --}}
<section class="perfect-sec" aria-labelledby="perfect-heading">
    <div class="container">
        <div class="reveal" style="text-align:center; margin-bottom:3rem;">
            <span class="tag">Versatile &amp; Built for Scale</span>
            <h2 class="sec-h2" id="perfect-heading">Perfect for your venue.</h2>
        </div>
        <div class="perfect-grid reveal reveal-d1">
            @foreach([
                ['☕', 'Cafés'],
                ['🥤', 'Coffee Shops'],
                ['🍽️', 'Restaurants'],
                ['🥐', 'Bakeries'],
                ['🍔', 'Fast Food'],
                ['🚚', 'Food Trucks'],
                ['🧋', 'Tea Shops'],
                ['🍹', 'Juice Bars'],
                ['🍕', 'Pizza Shops'],
                ['🍳', 'Cloud Kitchens']
            ] as $p)
                <div class="perfect-pill">
                    <span class="perfect-icon">{{ $p[0] }}</span>
                    <span class="perfect-label">{{ $p[1] }}</span>
                </div>
            @endforeach
        </div>
    </div>
</section>



{{-- ── WHY CHOOSE US ───────────────────────────────── --}}
<section class="why-sec" aria-labelledby="why-heading">
    <div class="container-tight">
        <div class="reveal" style="text-align:center; margin-bottom:4rem;">
            <span class="tag">Why Choose Us?</span>
            <h2 class="sec-h2" id="why-heading">Why Choose BeanVista POS?</h2>
        </div>
        <div class="why-grid">
            @foreach([
                ['🚀', 'Fast & Reliable', 'Built on a high-performance database cluster ensuring zero delays at the counter during peak hours.'],
                ['🎯', 'Easy to Use', 'An intuitive interface that allows cashier onboarding in under 10 minutes with zero training required.'],
                ['🔒', 'Secure Data Management', 'Automated cloud backups and data encryption so you never lose a transaction record.'],
                ['✨', 'Modern Interface', 'Elegant, clutter-free layouts that enhance your counter and complement your venue\'s design.'],
                ['📈', 'Growing Businesses', 'Centralized settings that make launching your second branch or hundredth outlet seamless.']
            ] as $idx => $w)
                <div class="why-card reveal reveal-d{{ ($idx % 3) + 1 }}">
                    <div class="why-icon">{{ $w[0] }}</div>
                    <h3 class="why-title">{{ $w[1] }}</h3>
                    <p class="why-desc">{{ $w[2] }}</p>
                </div>
            @endforeach
        </div>
    </div>
</section>

{{-- ── PRICING ──────────────────────────────────── --}}
<section id="pricing" class="pricing-sec" aria-labelledby="pricing-heading">
    <div class="container-tight">
        <div class="reveal" style="text-align:center;margin-bottom:3rem">
            <span class="tag">Pricing</span>
            <h2 class="sec-h2" id="pricing-heading">Simple, scaled to your shop.</h2>
            <p style="color:var(--s500);margin-top:1rem">Built to grow with your first cafe &mdash; or your hundredth.</p>
        </div>

        <div class="price-grid">
            <article class="pc reveal">
                <div class="pc-tier">01 / STARTER</div>
                <div class="pc-price">$49<span class="pc-period">/mo</span></div>
                <p class="pc-bill">Billed annually</p>
                <ul class="pc-feats" aria-label="Starter plan features">
                    <li>1 POS terminal</li><li>Basic analytics</li><li>Online ordering</li><li>Email support</li>
                </ul>
                <a href="{{ route('start-trial') }}" class="pc-btn">Select Plan</a>
            </article>

            <article class="pc pc-feat reveal reveal-d1">
                <div class="pc-badge">Most Popular</div>
                <div class="pc-tier">02 / PROFESSIONAL</div>
                <div class="pc-price">$129<span class="pc-period">/mo</span></div>
                <p class="pc-bill">Billed annually</p>
                <ul class="pc-feats" aria-label="Professional plan features">
                    <li>5 POS terminals</li><li>Pro KDS integration</li><li>Inventory management</li><li>Customer loyalty</li><li>Priority support</li>
                </ul>
                <a href="{{ route('start-trial') }}" class="pc-btn pc-btn-feat">Start 30-Day Trial</a>
            </article>

            <article class="pc reveal reveal-d2">
                <div class="pc-tier">03 / ENTERPRISE</div>
                <div class="pc-price" style="font-size:2.5rem">Custom</div>
                <p class="pc-bill">Billed annually</p>
                <ul class="pc-feats" aria-label="Enterprise plan features">
                    <li>Unlimited terminals</li><li>Multi-site dashboard</li><li>Dedicated manager</li><li>Custom API access</li>
                </ul>
                <a href="{{ route('book-demo') }}" class="pc-btn">Contact Sales</a>
            </article>
        </div>
    </div>
</section>

{{-- ── FAQ ─────────────────────────────────────── --}}
<section id="faq" class="faq-sec" aria-labelledby="faq-heading">
    <div class="container-slim">
        <div class="reveal" style="text-align:center;margin-bottom:3rem">
            <span class="tag">Got questions?</span>
            <h2 class="sec-h2" id="faq-heading">Frequently Asked Questions</h2>
            <p style="color:var(--s500);margin-top:1rem">
                Can&apos;t find an answer?
                <a href="{{ route('book-demo') }}" style="color:var(--orange);font-weight:700;text-decoration:none">Talk to our team &rarr;</a>
            </p>
        </div>

        <div class="faq-list reveal" role="list">
            @foreach($faqs as $fi => $faq)
                @php
                    $fq = is_array($faq) ? ($faq['question'] ?? $faq[0] ?? '') : '';
                    $fa = is_array($faq) ? ($faq['answer'] ?? $faq[1] ?? '') : '';
                @endphp
                <div class="faq-item" role="listitem">
                    <button class="faq-btn" aria-expanded="false" aria-controls="faq-a-{{ $fi }}">
                        {{ $fq }}
                        <span class="faq-icon" aria-hidden="true">
                            <svg viewBox="0 0 12 12" fill="none" stroke-width="2" stroke-linecap="round"><path d="M6 2v8M2 6h8"/></svg>
                        </span>
                    </button>
                    <div class="faq-body" id="faq-a-{{ $fi }}" role="region">{!! $fa !!}</div>
                </div>
            @endforeach
        </div>
    </div>
</section>

{{-- ── CTA ───────────────────────────────────────── --}}
<section id="customers" class="cta-sec" aria-labelledby="cta-heading">
    <div class="cta-wrap reveal">
        <div class="cta-glow1" aria-hidden="true"></div>
        <div class="cta-glow2" aria-hidden="true"></div>
        <div class="cta-body">
            <span class="tag" style="color:var(--orange)">Simplify your operations</span>
            <h2 class="cta-h2" id="cta-heading">Grow a better<br>business.</h2>
            <a href="{{ route('start-trial') }}" class="cta-btn">Join the BeanVista POS Network</a>
            <p class="cta-note">Used by 4,000+ specialty food &amp; beverage outlets globally.</p>
        </div>
    </div>
</section>

</main>
@endsection
