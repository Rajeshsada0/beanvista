<?php $__env->startSection('title', 'About Us — The Story Behind BeanVista POS'); ?>
<?php $__env->startSection('meta_description', 'Discover the mission behind BeanVista POS. Built by a team of restaurant operators and software developers to provide the ultimate point-of-sale and kitchen management system.'); ?>

<?php $__env->startSection('head'); ?>
<style>

.page-header {
    padding: 7.5rem 0 4rem;
    text-align: center;
    background: linear-gradient(180deg, var(--s100) 0%, var(--s50) 100%);
    border-bottom: 1px solid var(--s200);
}
.page-title {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin-bottom: 1rem;
}
.page-subtitle {
    font-size: 1.125rem;
    color: var(--s500);
    max-width: 60ch;
    margin: 0 auto;
    line-height: 1.6;
}
.content-section {
    padding: 5rem 0;
}
.about-card {
    background: white;
    border: 1px solid var(--s200);
    border-radius: 2rem;
    padding: 2.5rem;
    box-shadow: 0 20px 40px rgba(0,0,0,0.02);
    line-height: 1.8;
    font-size: 1.0625rem;
    color: var(--s700);
}
.about-card p {
    margin-bottom: 1.5rem;
    white-space: pre-wrap;
}
.about-card p:last-child {
    margin-bottom: 0;
}
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 3rem;
}
@media(min-width: 640px) {
    .stats-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
.stat-box {
    background: white;
    border: 1px solid var(--s200);
    border-radius: 1.25rem;
    padding: 1.5rem;
    text-align: center;
}
.stat-number {
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--orange);
    letter-spacing: -0.03em;
}
.stat-label {
    font-family: monospace;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--s500);
    margin-top: 0.5rem;
}

</style>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main>
    <section class="page-header">
        <div class="container">
            <span class="tag">Our Story</span>
            <h1 class="page-title">Technology Built<br>For Taste.</h1>
            <p class="page-subtitle">We build tools that help food &amp; beverage outlets run smoother, waste less, and connect deeper with their guests.</p>
        </div>
    </section>

    <section class="content-section">
        <div class="container-slim">
            <div class="reveal about-card">
                <p><?php echo e($settings->get('page_about_content', "We are a team of coffee lovers and software developers who wanted to build the absolute best operating system for cafes and restaurants.\n\nBeanVista POS was born out of a desire to make kitchen communication seamless and give operators detailed metrics about their sales, inventory, and staff without a clunky interface.")); ?></p>
            </div>

            <div class="stats-grid reveal reveal-d1">
                <div class="stat-box">
                    <div class="stat-number">4K+</div>
                    <div class="stat-label">Outlets Connected</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">28</div>
                    <div class="stat-label">Countries Served</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">99.99%</div>
                    <div class="stat-label">Core Uptime</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">60m</div>
                    <div class="stat-label">Average Setup</div>
                </div>
            </div>
        </div>
    </section>
</main>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('frontend', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH E:\Project\beanvista\resources\views/frontend/about.blade.php ENDPATH**/ ?>