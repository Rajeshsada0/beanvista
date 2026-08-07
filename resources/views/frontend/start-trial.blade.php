@extends('frontend')

@section('title', 'Start Free Trial — 30 Days Free | CREMA.OS Cafe Management Software')
@section('meta_description', 'Start your free 30-day trial of CREMA.OS cafe management software. No credit card required. Full access to POS, KDS, inventory, loyalty rewards, and table booking. Get your cafe live in 60 seconds.')
@section('canonical', url('/start-trial'))
@section('og_title', 'Start Free Trial — CREMA.OS')
@section('og_description', '30-day free trial. No credit card. Full access to POS, KDS, inventory, loyalty rewards, and table booking for your cafe.')

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
.stats-row { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; padding-top:2rem; border-top:1px solid var(--s200); }
.stat-big { font-size:1.5rem; font-weight:800; letter-spacing:-.03em; margin-bottom:.3rem; }
.stat-lbl2 { font-size:.625rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--s400); }
.form-card { background:white; border-radius:2rem; padding:2rem; box-shadow:0 25px 50px rgba(0,0,0,.07); border:1px solid var(--s200); }
@media(min-width:640px){ .form-card{ padding:2.5rem; } }
.form-title { font-size:1.5rem; font-weight:800; letter-spacing:-.03em; margin-bottom:.5rem; }
.form-sub { font-size:.875rem; color:var(--s500); margin-bottom:2rem; }
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
.phone-wrap {
    display:flex; background:var(--s50); border-radius:.75rem;
    box-shadow:inset 0 0 0 1px var(--s200); transition:box-shadow .2s;
}
.phone-wrap:focus-within { box-shadow:inset 0 0 0 2px var(--orange); }
.phone-select { background:transparent; border:none; padding:.75rem .5rem .75rem 1rem; font-size:.875rem; font-family:var(--font); color:var(--s500); cursor:pointer; outline:none; }
.phone-input { flex:1; background:transparent; border:none; padding:.75rem 1rem; font-size:.9375rem; font-family:var(--font); color:var(--s900); outline:none; min-width:0; }
.form-submit {
    display:block; width:100%; background:var(--orange); color:white; border:none;
    border-radius:.75rem; padding:.875rem 1rem; font-size:.9375rem; font-weight:700;
    font-family:var(--font); cursor:pointer; transition:all .2s;
    box-shadow:0 12px 30px rgba(234,88,12,.2); margin-top:1.5rem;
}
.form-submit:hover { background:#c2410c; transform:scale(1.02); }
.form-tos { text-align:center; font-size:.6875rem; text-transform:uppercase; letter-spacing:.08em; color:var(--s400); margin-top:1.5rem; }
.alert-error { background:#fef2f2; border:1px solid #fecaca; color:#991b1b; border-radius:.75rem; padding:1rem; font-size:.875rem; font-weight:600; margin-bottom:1.5rem; }
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
                <h1 class="page-h1">Your shop, live in<br><em>60 seconds.</em></h1>
                <p class="page-desc">
                    We&apos;ll spin up your workspace, import a sample menu, and walk you to your first sale.
                </p>

                <div class="stats-row">
                    <div>
                        <div class="stat-big">30</div>
                        <div class="stat-lbl2">Days Free</div>
                    </div>
                    <div>
                        <div class="stat-big">0</div>
                        <div class="stat-lbl2">Credit Card</div>
                    </div>
                    <div>
                        <div class="stat-big" style="color:var(--orange)">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                                 style="width:1.5rem;height:1.5rem" aria-label="Full access included">
                                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="stat-lbl2">Full Access</div>
                    </div>
                </div>
            </div>

            {{-- Right: registration form --}}
            <div style="animation:slideInR .8s .2s ease both">
                <div class="form-card">
                    <h2 class="form-title">Create your account</h2>
                    <p class="form-sub">Takes about 30 seconds.</p>

                    @if($errors->any())
                        <div class="alert-error" role="alert">
                            Please fix the errors below and try again.
                        </div>
                    @endif

                    <form method="POST" action="{{ route('register') }}" novalidate>
                        @csrf
                        <div class="fg">
                            <label class="flabel" for="name">Full Name</label>
                            <input type="text" name="name" id="name" class="finput"
                                   placeholder="Mira Okafor" value="{{ old('name') }}"
                                   required autocomplete="name">
                            @error('name')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        <div class="fg fg-mt">
                            <label class="flabel" for="email">Work Email</label>
                            <input type="email" name="email" id="email" class="finput"
                                   placeholder="you@cafe.com" value="{{ old('email') }}"
                                   required autocomplete="email">
                            @error('email')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        <div class="fg fg-mt">
                            <label class="flabel" for="phone">Phone Number</label>
                            <div class="phone-wrap">
                                <select name="phone_code" class="phone-select" aria-label="Country code">
                                    <option value="+977">NP (+977)</option>
                                    <option value="+1">US (+1)</option>
                                    <option value="+44">UK (+44)</option>
                                    <option value="+61">AU (+61)</option>
                                    <option value="+91">IN (+91)</option>
                                    <option value="+49">DE (+49)</option>
                                    <option value="+33">FR (+33)</option>
                                    <option value="+81">JP (+81)</option>
                                    <option value="+971">AE (+971)</option>
                                    <option value="+65">SG (+65)</option>
                                </select>
                                <input type="tel" name="phone" id="phone" class="phone-input"
                                       placeholder="(555) 000-0000" value="{{ old('phone') }}"
                                       required autocomplete="tel">
                            </div>
                            @error('phone')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        <div class="fg fg-mt">
                            <label class="flabel" for="cafe_name">Cafe Name</label>
                            <input type="text" name="cafe_name" id="cafe_name" class="finput"
                                   placeholder="Acme Coffee" value="{{ old('cafe_name') }}"
                                   required autocomplete="organization">
                            @error('cafe_name')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        <div class="fg fg-mt">
                            <label class="flabel" for="password">Password</label>
                            <input type="password" name="password" id="password" class="finput"
                                   placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                                   required autocomplete="new-password">
                            @error('password')<p class="form-error">{{ $message }}</p>@enderror
                        </div>
                        {{-- Mirror to confirmation so the standard register controller validates --}}
                        <input type="hidden" name="password_confirmation" id="password_confirmation">
                        <button type="submit" class="form-submit">Start 30-Day Free Trial</button>
                    </form>
                    <p class="form-tos">By continuing you agree to our Terms of Service and Privacy Policy.</p>
                </div>
            </div>
        </div>
    </div>
</main>
@endsection

@section('scripts')
<script>
// Mirror password → password_confirmation for single-password UX
document.getElementById('password').addEventListener('input', function () {
    document.getElementById('password_confirmation').value = this.value;
});
</script>
@endsection
