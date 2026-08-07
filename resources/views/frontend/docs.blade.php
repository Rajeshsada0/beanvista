@extends('frontend')

@section('title', 'Documentation & User Guide — BeanVista POS')
@section('meta_description', 'Learn how to set up, configure, and operate BeanVista POS. Step-by-step guides for Table Booking, Orders, POS, Menu, Inventory, KDS, Loyalty, and Admin Panels.')

@section('head')
<style>
@verbatim
.docs-header {
    padding: 7.5rem 0 3.5rem;
    background: linear-gradient(180deg, var(--s100) 0%, var(--s50) 100%);
    border-bottom: 1px solid var(--s200);
}
.docs-title {
    font-size: clamp(2.25rem, 5vw, 3.5rem);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin-bottom: 0.5rem;
}
.docs-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;
}
@media(min-width:1024px){
    .docs-container {
        grid-template-columns: 300px 1fr;
    }
}

/* Sidebar navigation */
.docs-sidebar {
    position: sticky;
    top: 6rem;
    height: 80vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-right: 1rem;
    scrollbar-width: thin;
}
@media(max-width:1023px){
    .docs-sidebar {
        position: static;
        flex-direction: row;
        overflow-x: auto;
        height: auto;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--s200);
        margin-bottom: 1.5rem;
        scrollbar-width: none;
    }
    .docs-sidebar::-webkit-scrollbar { display: none; }
}
.docs-nav-group-title {
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--s400);
    margin: 1rem 0 0.5rem 0.5rem;
}
.docs-nav-group-title:first-child {
    margin-top: 0;
}
.docs-nav-link {
    display: block;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--s500);
    text-decoration: none;
    transition: all 0.2s;
    white-space: nowrap;
}
.docs-nav-link:hover {
    color: var(--s900);
    background: var(--s100);
}
.docs-nav-link.active {
    color: var(--orange);
    background: var(--orange-10);
}

/* Docs Content */
.docs-content {
    line-height: 1.8;
    color: var(--s700);
    font-size: 1.0625rem;
}
.docs-sec {
    margin-bottom: 5rem;
    scroll-margin-top: 6.5rem;
}
.docs-sec:last-child {
    margin-bottom: 0;
}
.docs-sec h2 {
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--s900);
    letter-spacing: -0.03em;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--s200);
    padding-bottom: 0.5rem;
}
.docs-sec h3 {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--s900);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
}
.docs-sec p {
    margin-bottom: 1.25rem;
}
.docs-sec ul, .docs-sec ol {
    margin-left: 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.docs-sec li strong {
    color: var(--s900);
}

/* Info Alert Callout */
.info-box {
    background: var(--s100);
    border-left: 4px solid var(--orange);
    border-radius: 0.75rem;
    padding: 1.25rem 1.5rem;
    margin: 1.5rem 0;
    font-size: 0.9375rem;
}
.info-box strong {
    color: var(--s900);
    display: block;
    margin-bottom: 0.25rem;
}

/* Steps list */
.step-list {
    list-style: none;
    counter-reset: steps;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.step-item {
    position: relative;
    padding-left: 3rem;
}
.step-item::before {
    counter-increment: steps;
    content: counter(steps);
    position: absolute;
    left: 0;
    top: 0.25rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--orange);
    color: white;
    font-weight: 800;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
@endverbatim
</style>
@endsection

@section('content')
<main>
    {{-- Header --}}
    <section class="docs-header">
        <div class="container">
            <span class="tag">Knowledge Base</span>
            <h1 class="docs-title">Complete User Documentation</h1>
            <p style="color:var(--s500); max-width:70ch; font-weight: 500;">
                Step-by-step guides and usage notes for all 19 main administration, point-of-sale, inventory, and restaurant features of BeanVista POS.
            </p>
        </div>
    </section>

    {{-- Layout Container --}}
    <div class="docs-container">
        {{-- Sticky Sidebar navigation --}}
        <aside class="docs-sidebar">
            <div class="docs-nav-group-title">1. Getting Started</div>
            <a href="#quickstart" class="docs-nav-link active">Account &amp; Onboarding</a>
            
            <div class="docs-nav-group-title">2. Front of House</div>
            <a href="#pos-viewer" class="docs-nav-link">POS Viewer Console</a>
            <a href="#table-book" class="docs-nav-link">Table Book Configuration</a>
            <a href="#reservations" class="docs-nav-link">Reservations</a>
            <a href="#orders" class="docs-nav-link">Orders Log</a>
            
            <div class="docs-nav-group-title">3. Kitchen &amp; Service</div>
            <a href="#kitchen-kds" class="docs-nav-link">Kitchen Display (KDS)</a>
            <a href="#service-view" class="docs-nav-link">Service &amp; Expediter View</a>
            
            <div class="docs-nav-group-title">4. Menus &amp; Stock</div>
            <a href="#menu-items" class="docs-nav-link">Menu Items &amp; Categories</a>
            <a href="#inventory" class="docs-nav-link">Inventory &amp; Ingredients</a>
            <a href="#media-library" class="docs-nav-link">Media Library</a>
            
            <div class="docs-nav-group-title">5. Relationship &amp; Loyalty</div>
            <a href="#customers" class="docs-nav-link">Customer Profiles</a>
            <a href="#loyalty" class="docs-nav-link">Loyalty Tiers</a>
            
            <div class="docs-nav-group-title">6. Audits &amp; Finance</div>
            <a href="#finance" class="docs-nav-link">Finance &amp; Expenses</a>
            <a href="#reports" class="docs-nav-link">Business Reports</a>
            <a href="#staff-performance" class="docs-nav-link">Staff Performance</a>
            
            <div class="docs-nav-group-title">7. System Admin</div>
            <a href="#taxes" class="docs-nav-link">Taxes &amp; Service Charges</a>
            <a href="#my-plan" class="docs-nav-link">My Plan Settings</a>
            <a href="#support-tickets" class="docs-nav-link">Support Tickets</a>
            <a href="#branches" class="docs-nav-link">Branches &amp; Outlets</a>
            <a href="#global-settings" class="docs-nav-link">Global Settings</a>
        </aside>

        {{-- Docs Articles --}}
        <div class="docs-content">
            {{-- Account & Onboarding --}}
            <section id="quickstart" class="docs-sec">
                <h2>Account &amp; Onboarding</h2>
                <p>
                    BeanVista POS provisions an isolated database tenant workspace for each registering cafe business. Follow these setup steps to configure your account:
                </p>
                <ol class="step-list">
                    <li class="step-item">
                        <strong>Sign Up:</strong> Register your administrator profile at <a href="{{ route('register') }}" style="color:var(--orange); font-weight:700;">{{ route('register') }}</a>.
                    </li>
                    <li class="step-item">
                        <strong>Cafe Identity:</strong> Go to the sidebar, select **Global Settings**, and configure your cafe brand title, currency symbols (e.g. $, रू), and upload your brand logo.
                    </li>
                    <li class="step-item">
                        <strong>Branch Layout:</strong> If operating multiple locations, open the **Branches** page to setup distinct outlets prior to creating tables or menus.
                    </li>
                </ol>
            </section>

            {{-- POS Viewer Console --}}
            <section id="pos-viewer" class="docs-sec">
                <h2>POS Viewer Console</h2>
                <p>
                    The **POS Viewer** is the cashiers central transaction interface. It supports item selections, discount applications, and payment processing.
                </p>
                <h3>How to process a sale:</h3>
                <ul role="list">
                    <li><strong>Category Filters:</strong> Tap top menu filters (e.g. Bakery, Drinks) to navigate menu options quickly.</li>
                    <li><strong>Item Selections:</strong> Tap items to add them to the virtual cart. If the item has modifiers, select options (e.g. Milk type, Extra shot) in the overlay popup.</li>
                    <li><strong>Dine-In vs Takeaway:</strong> Assign a dining table number or select takeaway.</li>
                    <li><strong>Billing:</strong> Click Checkout, select payment method (Cash, Card, QR, or Split Payment), and click complete to trigger print operations.</li>
                </ul>
            </section>

            {{-- Table Book Configuration --}}
            <section id="table-book" class="docs-sec">
                <h2>Table Book Configuration</h2>
                <p>
                    Digitize your physical floor plan to manage tables, seats capacity, and service logs in real time.
                </p>
                <h3>How to draw and place tables:</h3>
                <ol role="list">
                    <li>Navigate to the **Table Book** page.</li>
                    <li>Choose a layout section (e.g., Main Dining, Balcony, Terrace).</li>
                    <li>Click **Add Table**. Assign a table label (e.g. T-1) and capacity size (e.g. 4 Seats).</li>
                    <li>Move the table onto the digital canvas grid to represent your actual room layout. Tapping any table launches ordering directly.</li>
                </ol>
            </section>

            {{-- Reservations --}}
            <section id="reservations" class="docs-sec">
                <h2>Reservations</h2>
                <p>
                    Coordinate customer table bookings, manage arrival schedules, and assign bookings to specific floor layouts.
                </p>
                <h3>Managing reservations:</h3>
                <ul role="list">
                    <li><strong>Add Booking:</strong> Click **New Reservation**, fill in Customer Name, Contact Number, Guest Count, Reservation Date &amp; Time.</li>
                    <li><strong>Assign Table:</strong> Link the booking to a pre-configured table from your floor plan.</li>
                    <li><strong>Status Updates:</strong> Update bookings to *Confirmed*, *Arrived*, or *Cancelled*. The POS Viewer automatically alerts cashiers if a reserved table is approaching a booked time.</li>
                </ul>
            </section>

            {{-- Orders Log --}}
            <section id="orders" class="docs-sec">
                <h2>Orders Log</h2>
                <p>
                    The **Orders** page logs all transactions across dine-in, takeaway, and online orders. It serves as the primary auditing hub for cashier shifts.
                </p>
                <ul role="list">
                    <li><strong>Search &amp; Filter:</strong> Query orders by Receipt Number, Date range, Status (Pending, Paid, Void), or cashier name.</li>
                    <li><strong>Refunds &amp; Voids:</strong> Open any paid order detail card and click **Void Order** (requires manager permissions) to cancel transactions and auto-revert inventory quantities.</li>
                    <li><strong>Print Reprint:</strong> Click **Reprint Receipt** to send receipt layouts back to the physical thermal printers.</li>
                </ul>
            </section>

            {{-- Kitchen Display (KDS) --}}
            <section id="kitchen-kds" class="docs-sec">
                <h2>Kitchen Display (KDS)</h2>
                <p>
                    The KDS console provides kitchen cooks with digital ticket queues, sorting orders automatically by preparation time and modifying items dynamically.
                </p>
                <ul role="list">
                    <li><strong>Automatic Routing:</strong> Prep tickets route automatically based on categories (e.g. espresso orders to the Bar KDS, hot mains to the Kitchen KDS).</li>
                    <li><strong>Cooking Toggles:</strong> Click the card timer to change order status to *Preparing* (amber border). Once cooked, tap *Complete* to archive the ticket and notify servers.</li>
                </ul>
            </section>

            {{-- Service View --}}
            <section id="service-view" class="docs-sec">
                <h2>Service &amp; Expediter View</h2>
                <p>
                    The **Service View** (or Expediter Console) sits at the pass counter. It serves as the link between the cooking team and waiters.
                </p>
                <ul role="list">
                    <li><strong>Consolidated Tickets:</strong> Monitors ready orders from all kitchen KDS screens simultaneously.</li>
                    <li><strong>Waiter Dispatches:</strong> Waiters see flashing highlights for completed dishes. Tapping *Dispatched* archives the order, clearing it from the wait pass area.</li>
                </ul>
            </section>

            {{-- Menu Items & Categories --}}
            <section id="menu-items" class="docs-sec">
                <h2>Menu Items &amp; Categories</h2>
                <p>
                    Create food and drink products, manage modifiers, catalog categories, and set tax percentages.
                </p>
                <h3>How to build a menu product:</h3>
                <ol class="step-list">
                    <li class="step-item">
                        <strong>Category Creation:</strong> Go to the Menu page, click **Categories**, and add a new category (e.g. Hot Coffees) with a display icon.
                    </li>
                    <li class="step-item">
                        <strong>New Item:</strong> Click **Add Product**, enter the Item Name, SKU, Description, Selling Price, and assign it to the category.
                    </li>
                    <li class="step-item">
                        <strong>Link Image:</strong> Select an image from the **Media Library** or upload a new square photo.
                    </li>
                    <li class="step-item">
                        <strong>Modifiers:</strong> Create addon arrays (e.g., Milk type options, Extra syrup) and link them to the product.
                    </li>
                </ol>
            </section>

            {{-- Inventory & Ingredients --}}
            <section id="inventory" class="docs-sec">
                <h2>Inventory &amp; Ingredients</h2>
                <p>
                    Audit raw ingredients, monitor stock levels, and set up automatic deductions during point-of-sale cash register checkouts.
                </p>
                <h3>Setting up ingredient deduct recipes:</h3>
                <ul role="list">
                    <li><strong>Create Ingredient:</strong> Go to **Inventory**, select **Ingredients**, and add items (e.g. Coffee Beans, Fresh Milk) measuring in grams or milliliters.</li>
                    <li><strong>Define Stock Levels:</strong> Log your starting quantities and low-stock warning limits (e.g. notify when Coffee Beans fall below 1000g).</li>
                    <li><strong>Link Recipe:</strong> Edit a menu item (e.g. Espresso) and define its recipe (e.g. consumes 18g Coffee Beans). Tapping a sale at the checkout terminal will deduct 18g from the database.</li>
                </ul>
            </section>

            {{-- Media Library --}}
            <section id="media-library" class="docs-sec">
                <h2>Media Library</h2>
                <p>
                    The **Media Library** hosts all uploaded images for menu items, floor layouts, and digital branding assets.
                </p>
                <ul role="list">
                    <li><strong>Upload Limit:</strong> Upload JPG, PNG, or WebP images up to 2MB.</li>
                    <li><strong>Asset Reuse:</strong> Upload an image once and link it to multiple products or outlets, avoiding duplicate file storage.</li>
                </ul>
            </section>

            {{-- Customer Profiles --}}
            <section id="customers" class="docs-sec">
                <h2>Customer Profiles</h2>
                <p>
                    Build a database of guest details to coordinate personalized service, track preferences, and run marketing plans.
                </p>
                <ul role="list">
                    <li><strong>Create Profile:</strong> Register customer details (Name, Contact Email, Mobile Number, Birthday) during POS checkouts.</li>
                    <li><strong>Purchase Audit:</strong> View the profiles transactions log to monitor visit intervals, favorite dishes, and average ticket spending.</li>
                </ul>
            </section>

            {{-- Loyalty Tiers --}}
            <section id="loyalty" class="docs-sec">
                <h2>Loyalty Tiers</h2>
                <p>
                    Issue loyalty cards and configure point-earning ratios to reward frequent diners.
                </p>
                <h3>Setting up Loyalty plans:</h3>
                <ul role="list">
                    <li><strong>Ratio Setup:</strong> Under the **Loyalty** page, set the points ratio (e.g. earn 1 point per $10 spent).</li>
                    <li><strong>Reward Levels:</strong> Define redemption steps (e.g., 100 points = $10 discount voucher).</li>
                    <li><strong>Loyalty Cards:</strong> Assign numeric or QR codes to customer profiles to track points automatically during checkouts.</li>
                </ul>
            </section>

            {{-- Finance & Expenses --}}
            <section id="finance" class="docs-sec">
                <h2>Finance &amp; Expenses</h2>
                <p>
                    Track expenses, log vendor payouts, audit invoice bills, and monitor payment types to calculate net profit margins.
                </p>
                <ul role="list">
                    <li><strong>Log Expense:</strong> Click **New Expense**, input Vendor name, Category (e.g. Raw Material, Utilities, Rent), Transaction Date, Cost, and upload a digital receipt image.</li>
                    <li><strong>Payment Reconciliation:</strong> Review payment totals grouped by Cash, Card, and QR payouts to verify matching terminal settlements.</li>
                </ul>
            </section>

            {{-- Business Reports --}}
            <section id="reports" class="docs-sec">
                <h2>Business Reports</h2>
                <p>
                    Access data analytics dashboards. Review daily metrics, calculate Gross Profits, analyze product sales curves, and check waste reports.
                </p>
                <ul role="list">
                    <li><strong>Sales Charts:</strong> Interactive charts plot revenue spikes by hour, day, and week to optimize staffing plans.</li>
                    <li><strong>Best Sellers:</strong> The top-performing matrix reports highlight high-margin best sellers and low-demand items.</li>
                    <li><strong>Exporting:</strong> Click **Export CSV** or **Download PDF** to generate spreadsheets for bookkeeping.</li>
                </ul>
            </section>

            {{-- Staff Performance --}}
            <section id="staff-performance" class="docs-sec">
                <h2>Staff Performance</h2>
                <p>
                    Audit cashier shifts, check sales totals per employee, track modifier performance, and log system activities.
                </p>
                <ul role="list">
                    <li><strong>Activity Logs:</strong> Security tracks modifications, voids, and cash drawer openings with timestamp details.</li>
                    <li><strong>Shift Balancing:</strong> Cashiers perform a *Close Shift* process at the end of their shift, logging expected cash vs. actual cash.</li>
                </ul>
            </section>

            {{-- Taxes & Service Charges --}}
            <section id="taxes" class="docs-sec">
                <h2>Taxes &amp; Service Charges</h2>
                <p>
                    Configure regional tax rules (VAT, GST, State Taxes) and conditional service charges for dine-in tables.
                </p>
                <ul role="list">
                    <li><strong>Create Tax Rate:</strong> Define rates (e.g., VAT 13%) and set them to apply globally or to select categories (e.g. food only, exclude raw stock).</li>
                    <li><strong>Service Charges:</strong> Apply optional service charges (e.g., 10% dine-in service charge) that trigger only for table seating orders.</li>
                </ul>
            </section>

            {{-- My Plan Settings --}}
            <section id="my-plan" class="docs-sec">
                <h2>My Plan Settings</h2>
                <p>
                    Monitor your subscription billing cycle, view terminal limits, and adjust tier features.
                </p>
                <ul role="list">
                    <li><strong>Plan Details:</strong> Displays your current plan (Starter, Professional, Enterprise) and active features list.</li>
                    <li><strong>Invoicing:</strong> Download subscription invoices, update billing addresses, and change linked payment cards.</li>
                </ul>
            </section>

            {{-- Support Tickets --}}
            <section id="support-tickets" class="docs-sec">
                <h2>Support Tickets</h2>
                <p>
                    Connect with our technical support team to solve printer pairing issues, dashboard errors, or request customized templates.
                </p>
                <ul role="list">
                    <li><strong>Submit Ticket:</strong> Click **New Ticket**, set priority levels (Low, Medium, Critical), and explain the issue.</li>
                    <li><strong>File Upload:</strong> Attach screenshots or logs to help us resolve inquiries quickly.</li>
                </ul>
            </section>

            {{-- Branches & Outlets --}}
            <section id="branches" class="docs-sec">
                <h2>Branches &amp; Outlets</h2>
                <p>
                    Manage multi-outlet businesses. Centralize control over menu configurations while auditing store performance individually.
                </p>
                <ul role="list">
                    <li><strong>Create Branch:</strong> Click **Add Branch**, register Address details, Contact details, and assign managers.</li>
                    <li><strong>Outlet Menus:</strong> Set outlet-specific pricing rules (e.g. airport branch menu items marked up by 15%).</li>
                </ul>
            </section>

            {{-- Global Settings --}}
            <section id="global-settings" class="docs-sec">
                <h2>Global Settings</h2>
                <p>
                    Configure general workspace parameters, localization details, and default security behaviors.
                </p>
                <ul role="list">
                    <li><strong>Localization:</strong> Set your Currency Code, Symbol prefix, Date/Time layouts, and timezone parameters.</li>
                    <li><strong>POS Controls:</strong> Set password prompt options for voids and specify automated closing shift drawer print actions.</li>
                </ul>
            </section>
        </div>
    </div>
</main>
@endsection

@section('scripts')
<script>
(function(){
    'use strict';
    // Highlight active link in sidebar as user scrolls
    const links = document.querySelectorAll('.docs-nav-link');
    const secs = document.querySelectorAll('.docs-sec');
    
    function highlightNav() {
        let currentSecId = '';
        secs.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (window.scrollY >= (top - 120)) {
                currentSecId = sec.getAttribute('id');
            }
        });
        
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSecId) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNav, { passive: true });
    
    // Add smooth scroll behavior to links
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                window.scrollTo({
                    top: targetEl.offsetTop - 90,
                    behavior: 'smooth'
                });
            }
            
            // For mobile scroll drawer compatibility
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
})();
</script>
@endsection
