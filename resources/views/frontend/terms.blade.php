@extends('frontend')

@section('title', 'Terms of Service — BeanVista POS')
@section('meta_description', 'Review the terms of service of BeanVista POS cafe management SaaS ecosystem. Multi-tenant rights, subscriptions rules, and POS hardware usage.')

@section('head')
<style>
@verbatim
.page-header {
    padding: 7.5rem 0 4rem;
    text-align: center;
    background: linear-gradient(180deg, var(--s100) 0%, var(--s50) 100%);
    border-bottom: 1px solid var(--s200);
}
.page-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin-bottom: 1rem;
}
.policy-section {
    padding: 5rem 0;
}
.policy-card {
    background: white;
    border: 1px solid var(--s200);
    border-radius: 2rem;
    padding: 2.5rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.02);
    line-height: 1.8;
    font-size: 1.0625rem;
    color: var(--s700);
}
.policy-card p {
    margin-bottom: 1.5rem;
    white-space: pre-wrap;
}
.policy-card p:last-child {
    margin-bottom: 0;
}
@endverbatim
</style>
@endsection

@section('content')
<main>
    <section class="page-header">
        <div class="container">
            <span class="tag">Legal</span>
            <h1 class="page-title">Terms &amp; Conditions</h1>
        </div>
    </section>

    <section class="policy-section">
        <div class="container-slim">
            <div class="reveal policy-card">
                <p>{{ $settings->get('page_tnc_content', 'By accessing our website, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance.') }}</p>
            </div>
        </div>
    </section>
</main>
@endsection
