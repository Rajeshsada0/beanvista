@extends('frontend')

@section('title', 'Book a Free Demo — See CREMA.OS Live | Cafe Management Software')
@section('meta_description', 'Book a free 15-minute demo of CREMA.OS cafe management software. See how our POS, kitchen display system, and inventory management works live with your menu and floor plan. No sales pitch.')
@section('canonical', url('/book-demo'))
@section('og_title', 'Book a Demo — See CREMA.OS Cafe Software Live')
@section('og_description', 'Get a personalized demo of CREMA.OS. Live KDS, POS and inventory walkthrough in 15 minutes with a real cafe operator — no scripts.')

@section('head')
<style>
@verbatim
.page-wrap { min-height:100vh; display:flex; align-items:center; padding:6rem 1rem 4rem; position:relative; overflow:hidden; }
.page-glow-l { position:absolute; left:-10rem; top:5rem; width:24rem; height:24rem; border-radius:50%; background:var(--orange-10); filter:blur(100px); pointer-events:none; }
.page-glow-r { position:absolute; right:-10rem; bottom:5rem; width:24rem; height:24rem; border-radius:50%; background:var(--orange-10); filter:blur(100px); pointer-events:none; }
.page-grid { display:grid; gap:3rem; width:100%; max-width:1280px; margin:0 auto; align-items:center; }
@media(min-width:1024px){ .page-grid{ grid-template-columns:1fr 1fr; gap:6rem; } }
.page-h1 { font-size:clamp(2.25rem,5vw,3.75rem); font-weight:900; letter-spacing:-.04em; line-height:1.05; margin-bottom:1.5rem; }
.page-h1 em { font-style:normal; color:var(--orange); }
.page-desc { font-size:1.0625rem; color:var(--s500); line-height:1.65; margin-bottom:2rem; }
.check-list { list-style:none; display:flex; flex-direction:column; gap:.875rem; margin-bottom:2.5rem; }
.check-list li { display:flex; align-items:flex-start; gap:.75rem; font-weight:500; color:var(--s700); }
.check-icon { width:1.25rem; height:1.25rem; border-radius:50%; background:rgba(234,88,12,.12); color:var(--orange); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:.1rem; }
.testimonial { border:1px solid var(--s200); background:rgba(255,255,255,.5); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); border-radius:1rem; padding:1.5rem; }
.testimonial-q { font-size:1.0625rem; font-style:italic; color:var(--s700); margin-bottom:.75rem; }
.testimonial-author { display:flex; align-items:center; gap:.75rem; }
.testimonial-avatar { width:2.5rem; height:2.5rem; border-radius:50%; background:var(--s200); flex-shrink:0; }
.testimonial-name { font-size:.875rem; font-weight:700; }
.testimonial-cafe { font-family:monospace; font-size:.75rem; color:var(--s500); }
.form-card { background:white; border-radius:2rem; padding:2rem; box-shadow:0 25px 50px rgba(0,0,0,.07); border:1px solid var(--s200); }
@media(min-width:640px){ .form-card{ padding:2.5rem; } }
.form-title { font-size:1.5rem; font-weight:800; letter-spacing:-.03em; margin-bottom:.5rem; }
.form-sub { font-size:.875rem; color:var(--s500); margin-bottom:2rem; }
.form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.fg { display:flex; flex-direction:column; gap:.375rem; }
.fg-mt { margin-top:1.25rem; }
.flabel { font-size:.75rem; font-weight:700; color:var(--s500); text-transform:uppercase; letter-spacing:.05em; }
.finput {
    width:100%; border:none; background:var(--s50); border-radius:.75rem;
    padding:.75rem 1rem; font-size:.9375rem; font-family:var(--font);
    color:var(--s900); box-shadow:inset 0 0 0 1px var(--s200);
    transition:box-shadow .2s; outline:none;
}
.finput:focus { box-shadow:inset 0 0 0 2px var(--orange); }
.form-error { font-size:.75rem; color:#ef4444; font-weight:600; margin-top:.25rem; }
.form-submit {
    display:block; width:100%; background:var(--s900); color:white; border:none;
    border-radius:.75rem; padding:.875rem 1rem; font-size:.9375rem; font-weight:700;
    font-family:var(--font); cursor:pointer; transition:background .2s; margin-top:1.5rem;
}
.form-submit:hover { background:var(--orange); }
.form-note { text-align:center; font-size:.75rem; color:var(--s400); margin-top:1.5rem; }
.alert-ok { background:#ecfdf5; border:1px solid #a7f3d0; color:#065f46; border-radius:.75rem; padding:1rem; font-size:.9375rem; font-weight:600; margin-bottom:1.5rem; }
@endverbatim
</style>
@endsection

@section('content')
<main>
    <div class="page-wrap">
        <div class="page-glow-l" aria-hidden="true"></div>
        <div class="page-glow-r" aria-hidden="true"></div>

        <div class="page-grid">
            {{-- Left: copy --}}
            <div style="animation:fadeInUp .8s ease both">
                <h1 class="page-h1">See your shop running<br>on <em>CREMA.OS.</em></h1>
                <p class="page-desc">
                    A real cafe operator on the call &mdash; no SDR scripts. We&apos;ll mirror your menu, your floor plan, and your KDS in under 15 minutes.
                </p>

                <ul class="check-list" aria-label="What you get in the demo">
                    @foreach([
                        'Live KDS demo with your top 5 menu items',
                        'Floor plan import from your current system',
                        'Custom pricing tailored to your shop count',
                        'Migration plan with zero downtime',
                    ] as $item)
                    <li>
                        <span class="check-icon" aria-hidden="true">
                            <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
                                <path d="M11.667 3.5L5.25 9.917 2.333 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </span>
                        {{ $item }}
                    </li>
                    @endforeach
                </ul>

                <blockquote class="testimonial">
                    <p class="testimonial-q">&ldquo;Set up in 4 days. ROI by week 3.&rdquo;</p>
                    <div class="testimonial-author">
                        <div class="testimonial-avatar" aria-hidden="true"></div>
                        <div>
                            <div class="testimonial-name">Mira Okafor</div>
                            <div class="testimonial-cafe">GREYFERN COFFEE</div>
                        </div>
                    </div>
                </blockquote>
            </div>

            {{-- Right: form --}}
            <div style="animation:slideInR .8s .2s ease both">
                <div class="form-card">
                    <h2 class="form-title">Pick a time</h2>
                    <p class="form-sub">All times in your local timezone. Reschedule anytime.</p>

                    @if(session('success'))
                        <div class="alert-ok" role="alert">{{ session('success') }}</div>
                    @endif

                    <form method="POST" action="{{ route('book-demo.store') }}" novalidate>
                        @csrf
                        <div class="form-row-2">
                            <div class="fg">
                                <label class="flabel" for="first_name">First Name</label>
                                <input type="text" name="first_name" id="first_name" class="finput"
                                       placeholder="Mira" value="{{ old('first_name') }}"
                                       required autocomplete="given-name">
                                @error('first_name')<p class="form-error">{{ $message }}</p>@enderror
                            </div>
                            <div class="fg">
                                <label class="flabel" for="last_name">Last Name</label>
                                <input type="text" name="last_name" id="last_name" class="finput"
                                       placeholder="Okafor" value="{{ old('last_name') }}"
                                       required autocomplete="family-name">
                                @error('last_name')<p class="form-error">{{ $message }}</p>@enderror
                            </div>
                        </div>
                        <div class="fg fg-mt">
                            <label class="flabel" for="email">Work Email</label>
                            <input type="email" name="email" id="email" class="finput"
                                   placeholder="mira@greyfern.coffee" value="{{ old('email') }}"
                                   required autocomplete="email">
                            @error('email')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        <div class="fg fg-mt">
                            <label class="flabel" for="cafe_name">Cafe Name</label>
                            <input type="text" name="cafe_name" id="cafe_name" class="finput"
                                   placeholder="Greyfern Coffee" value="{{ old('cafe_name') }}"
                                   required autocomplete="organization">
                            @error('cafe_name')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        <button type="submit" class="form-submit">View Availability &rarr;</button>
                    </form>
                    <p class="form-note">No card required. We&apos;ll send a calendar invite within minutes.</p>
                </div>
            </div>
        </div>
    </div>
</main>
@endsection
