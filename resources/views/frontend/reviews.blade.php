@extends('frontend')

@section('title', 'Customer Reviews — What Operators Say About BeanVista POS')
@section('meta_description', 'Read verified reviews and testimonials from restaurant and cafe operators worldwide. Learn how BeanVista POS improved kitchen speeds and shop margins.')

@section('head')
<style>
@verbatim
.page-header {
    padding: 7.5rem 0 4rem;
    background: linear-gradient(180deg, var(--s100) 0%, var(--s50) 100%);
    border-bottom: 1px solid var(--s200);
}
.header-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    align-items: center;
}
@media(min-width: 768px) {
    .header-grid {
        grid-template-columns: 1.2fr 1fr;
        gap: 4rem;
    }
}
.page-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin-bottom: 1.25rem;
}
.page-subtitle {
    font-size: 1.125rem;
    color: var(--s500);
    line-height: 1.65;
}

/* Rating Stats Box */
.stats-card {
    background: white;
    border: 1px solid var(--s200);
    border-radius: 1.5rem;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.01);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.stats-summary {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}
.stats-number {
    font-size: 4rem;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: var(--s900);
    line-height: 1;
}
.stars-display {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}
.stars-row {
    display: flex;
    gap: 0.125rem;
    color: #f59e0b; /* Amber */
}
.stars-row svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: currentColor;
}
.stars-row svg.empty {
    color: var(--s200);
    fill: none;
}
.stats-count {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--s500);
}
.bars-container {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}
.bar-row {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--s600);
}
.bar-label {
    width: 3ch;
    text-align: right;
}
.bar-track {
    flex: 1;
    height: 0.5rem;
    background: var(--s100);
    border-radius: 999px;
    overflow: hidden;
}
.bar-fill {
    height: 100%;
    background: #f59e0b;
    border-radius: 999px;
}

/* Reviews Grid */
.reviews-section {
    padding: 5rem 0;
}
.reviews-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
}
@media(min-width: 1024px) {
    .reviews-layout {
        grid-template-columns: 1.7fr 1.3fr;
        gap: 4rem;
    }
}
.reviews-grid {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.review-card {
    background: white;
    border: 1px solid var(--s200);
    border-radius: 1.5rem;
    padding: 1.75rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.01);
}
.review-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
}
.review-author {
    font-weight: 800;
    color: var(--s900);
    font-size: 1rem;
}
.review-date {
    font-family: monospace;
    font-size: 0.6875rem;
    color: var(--s400);
    margin-top: 0.125rem;
}
.review-comment {
    font-size: 0.9375rem;
    color: var(--s600);
    line-height: 1.6;
}

/* Form Styles */
.write-card {
    background: white;
    border: 1px solid var(--s200);
    border-radius: 2rem;
    padding: 2.5rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.02);
    align-self: start;
    position: sticky;
    top: 6rem;
}
@media(max-width: 1023px) {
    .write-card {
        position: static;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
    }
}
.form-title {
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: -0.03em;
    margin-bottom: 0.5rem;
}
.form-subtitle {
    font-size: 0.875rem;
    color: var(--s500);
    margin-bottom: 2rem;
}
.rating-picker {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 1.5rem;
}
.star-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--s300);
    padding: 0.125rem;
    transition: transform 0.15s, color 0.15s;
}
.star-btn:hover {
    transform: scale(1.15);
}
.star-btn svg {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
}
.star-btn.active {
    color: #f59e0b;
}

.fg {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 1.25rem;
}
.flabel {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--s500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
.finput {
    width: 100%;
    border: none;
    background: var(--s50);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-size: 0.9375rem;
    font-family: var(--font);
    color: var(--s900);
    box-shadow: inset 0 0 0 1px var(--s200);
    transition: box-shadow 0.2s;
    outline: none;
}
.finput:focus {
    box-shadow: inset 0 0 0 2px var(--orange);
}
.form-error {
    font-size: 0.75rem;
    color: #ef4444;
    font-weight: 600;
    margin-top: 0.25rem;
}
.fsubmit {
    display: block;
    width: 100%;
    background: var(--orange);
    color: white;
    border: none;
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    font-size: 0.9375rem;
    font-weight: 700;
    font-family: var(--font);
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 12px 30px rgba(234, 88, 12, 0.2);
}
.fsubmit:hover {
    background: #c2410c;
    transform: translateY(-1px);
}
.alert-ok {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    border-radius: 0.75rem;
    padding: 1rem;
    font-size: 0.9375rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
}
@endverbatim
</style>
@endsection

@section('content')
<main>
    
    {{-- Header with Summary Cards --}}
    <section class="page-header">
        <div class="container">
            <div class="header-grid">
                <div>
                    <span class="tag">Testimonials</span>
                    <h1 class="page-title">Loved by cafe<br>operators.</h1>
                    <p class="page-subtitle">Read how CREMA.OS helps specialty coffee shops streamline operations, eliminate ticket bottlenecks, and track inventory recipes to the gram.</p>
                </div>
                
                {{-- Stats Summary Box --}}
                <div class="reveal stats-card">
                    <div class="stats-summary">
                        <div class="stats-number">{{ number_format($averageRating, 1) }}</div>
                        <div class="stars-display">
                            <div class="stars-row" aria-label="{{ $averageRating }} out of 5 stars">
                                @for($i = 1; $i <= 5; $i++)
                                    @if($i <= round($averageRating))
                                        <svg viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    @else
                                        <svg class="empty" viewBox="0 0 20 20" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    @endif
                                @endfor
                            </div>
                            <div class="stats-count">Based on {{ $totalReviews }} verified reviews</div>
                        </div>
                    </div>
                    
                    {{-- Bars Breakdown --}}
                    <div class="bars-container">
                        @foreach([5, 4, 3, 2, 1] as $stars)
                            @php
                                $count = $ratingCounts[$stars] ?? 0;
                                $percent = $totalReviews > 0 ? ($count / $totalReviews) * 100 : 0;
                            @endphp
                            <div class="bar-row">
                                <span class="bar-label">{{ $stars }}★</span>
                                <div class="bar-track">
                                    <div class="bar-fill" style="width: {{ $percent }}%"></div>
                                </div>
                                <span style="width: 3ch; text-align: right;">{{ $count }}</span>
                            </div>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </section>

    {{-- Main Reviews Section --}}
    <section class="reviews-section">
        <div class="container">
            <div class="reviews-layout">
                
                {{-- Left: Reviews List --}}
                <div class="reviews-grid">
                    @if($reviews->isEmpty())
                        <div class="review-card reveal text-center" style="padding: 4rem 2rem;">
                            <p style="font-weight: 700; color: var(--s500);">No reviews yet. Be the first to review us using the form on the right!</p>
                        </div>
                    @else
                        @foreach($reviews as $ri => $review)
                            <div class="reveal review-card reveal-d{{ ($ri % 3) + 1 }}">
                                <div class="review-header">
                                    <div>
                                        <div class="review-author">{{ $review->name }}</div>
                                        <div class="stars-row" style="margin-top: 0.375rem;" aria-label="{{ $review->rating }} stars">
                                            @for($s = 1; $s <= 5; $s++)
                                                @if($s <= $review->rating)
                                                    <svg viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                                @else
                                                    <svg class="empty" viewBox="0 0 20 20" stroke="currentColor" fill="none"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                                @endif
                                            @endfor
                                        </div>
                                    </div>
                                    <div class="review-date">{{ $review->created_at->format('M d, Y') }}</div>
                                </div>
                                <p class="review-comment">{{ $review->comment }}</p>
                            </div>
                        @endforeach
                    @endif
                </div>

                {{-- Right: Submit Form --}}
                <div class="reveal reveal-d2 write-card">
                    <h2 class="form-title">Write a Review</h2>
                    <p class="form-subtitle">Share your experience with CREMA.OS. Your feedback helps us build better tools.</p>

                    @if(session('success'))
                        <div class="alert-ok">{{ session('success') }}</div>
                    @endif

                    <form action="{{ route('reviews.store') }}" method="POST" id="reviewForm" novalidate>
                        @csrf
                        
                        <div class="fg">
                            <label class="flabel" style="margin-bottom: 0.50rem;">Overall Rating</label>
                            <input type="hidden" name="rating" id="ratingInput" value="5">
                            <div class="rating-picker" id="starContainer">
                                @for($star = 1; $star <= 5; $star++)
                                    <button type="button" class="star-btn active" data-value="{{ $star }}" aria-label="Rate {{ $star }} out of 5 stars">
                                        <svg viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                    </button>
                                @endfor
                            </div>
                            @error('rating')<p class="form-error">{{ $message }}</p>@enderror
                        </div>

                        <div class="fg">
                            <label class="flabel" for="name">Your Name</label>
                            <input type="text" name="name" id="name" class="finput" placeholder="Mira Okafor" value="{{ old('name') }}" required>
                            @error('name')<p class="form-error">{{ $message }}</p>@enderror
                        </div>

                        <div class="fg">
                            <label class="flabel" for="email">Email Address</label>
                            <input type="email" name="email" id="email" class="finput" placeholder="mira@greyfern.coffee" value="{{ old('email') }}" required>
                            @error('email')<p class="form-error">{{ $message }}</p>@enderror
                        </div>

                        <div class="fg">
                            <label class="flabel" for="comment">Review Comment</label>
                            <textarea name="comment" id="comment" class="finput" rows="4" placeholder="How has CREMA.OS helped you manage your cafe?" required style="resize:none;">{{ old('comment') }}</textarea>
                            @error('comment')<p class="form-error">{{ $message }}</p>@enderror
                        </div>

                        <button type="submit" class="fsubmit">Submit Review &rarr;</button>
                    </form>
                </div>

            </div>
        </div>
    </section>
</main>
@endsection

@section('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    var stars = document.querySelectorAll('#starContainer .star-btn');
    var ratingInput = document.getElementById('ratingInput');
    
    stars.forEach(function(star) {
        star.addEventListener('click', function() {
            var selectedValue = parseInt(this.getAttribute('data-value'));
            ratingInput.value = selectedValue;
            
            stars.forEach(function(s) {
                var sVal = parseInt(s.getAttribute('data-value'));
                if (sVal <= selectedValue) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
});
</script>
@endsection
