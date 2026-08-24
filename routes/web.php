<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * Public media route — serves files from the public disk directly via PHP.
 * This bypasses the storage symlink entirely and works on ALL hosting setups.
 */
Route::get('/img/{path}', function (string $path) {
    // Decode and sanitise — prevent directory traversal
    $path = rawurldecode($path);
    $path = ltrim(str_replace(['..', '\\'], ['', '/'], $path), '/');

    if (!Storage::disk('public')->exists($path)) {
        abort(404);
    }

    $content = Storage::disk('public')->get($path);
    $mime    = Storage::disk('public')->mimeType($path) ?: 'application/octet-stream';

    return response($content, 200)
        ->header('Content-Type', $mime)
        ->header('Cache-Control', 'public, max-age=86400')
        ->header('Access-Control-Allow-Origin', '*');
})->where('path', '.*')->name('media.serve');

Route::get('/', [\App\Http\Controllers\FrontEndController::class, 'home'])->name('home');
Route::get('/about', [\App\Http\Controllers\FrontEndController::class, 'about'])->name('about');
Route::get('/contact', [\App\Http\Controllers\FrontEndController::class, 'contact'])->name('contact');
Route::get('/privacy-policy', [\App\Http\Controllers\FrontEndController::class, 'privacy'])->name('privacy');
Route::get('/terms-and-conditions', [\App\Http\Controllers\FrontEndController::class, 'terms'])->name('terms');
Route::get('/docs', [\App\Http\Controllers\FrontEndController::class, 'docs'])->name('docs');
Route::get('/reviews', [\App\Http\Controllers\FrontEndController::class, 'reviews'])->name('reviews');
Route::post('/reviews', [\App\Http\Controllers\FrontEndController::class, 'submitReview'])->name('reviews.store');

Route::get('/book-demo', function () {
    return view('frontend.book-demo');
})->name('book-demo');

Route::post('/book-demo', [\App\Http\Controllers\DemoBookingController::class, 'store'])->name('book-demo.store');

Route::get('/start-trial', function () {
    return view('frontend.start-trial');
})->name('start-trial');

Route::get('/test-cache', function () {
    $tenant_id = auth()->id() ? auth()->user()->tenant_id : 1;
    return cache()->get('settings_tenant_' . $tenant_id);
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard — accessible to all authenticated users (role handled inside controller)
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    Route::post('/branches/switch', [\App\Http\Controllers\BranchController::class, 'switchBranch'])->name('branches.switch');
    Route::post('/stop-impersonating', [\App\Http\Controllers\Superadmin\TenantController::class, 'stopImpersonating'])->name('impersonate.stop');

    // Super Admin Routes
    Route::middleware('role:super_admin')->prefix('superadmin')->name('superadmin.')->group(function () {
        Route::get('/dashboard', [\App\Http\Controllers\Superadmin\DashboardController::class, 'index'])->name('dashboard');
        
        Route::resource('tenants', \App\Http\Controllers\Superadmin\TenantController::class)->except(['show']);
        Route::patch('tenants/{tenant}/toggle', [\App\Http\Controllers\Superadmin\TenantController::class, 'toggleStatus'])->name('tenants.toggle');
        Route::post('tenants/{tenant}/impersonate', [\App\Http\Controllers\Superadmin\TenantController::class, 'impersonate'])->name('tenants.impersonate');
        
        Route::resource('users', \App\Http\Controllers\Superadmin\UserController::class)->except(['show']);
        Route::post('app-settings', [\App\Http\Controllers\Superadmin\UserController::class, 'updateAppSettings'])->name('app-settings.update');
        
        // CMS & SEO Settings Routes
        Route::get('cms', [\App\Http\Controllers\Superadmin\CmsController::class, 'index'])->name('cms.index');
        Route::post('cms', [\App\Http\Controllers\Superadmin\CmsController::class, 'updateSettings'])->name('cms.update');
        Route::post('cms/reviews/{id}/toggle', [\App\Http\Controllers\Superadmin\CmsController::class, 'toggleReview'])->name('cms.reviews.toggle');
        Route::delete('cms/reviews/{id}', [\App\Http\Controllers\Superadmin\CmsController::class, 'deleteReview'])->name('cms.reviews.destroy');
        
        Route::resource('plans', \App\Http\Controllers\Superadmin\PlanController::class)->except(['show']);
        
        Route::get('verify-payments', [\App\Http\Controllers\Superadmin\PaymentVerificationController::class, 'index'])->name('verify-payments.index');
        Route::post('verify-payments/{id}/approve', [\App\Http\Controllers\Superadmin\PaymentVerificationController::class, 'approve'])->name('verify-payments.approve');
        Route::post('verify-payments/{id}/reject', [\App\Http\Controllers\Superadmin\PaymentVerificationController::class, 'reject'])->name('verify-payments.reject');
        Route::resource('payment-methods', \App\Http\Controllers\Superadmin\PaymentMethodController::class)->only(['store', 'update', 'destroy']);
        
        Route::get('support', [\App\Http\Controllers\Superadmin\SupportTicketController::class, 'index'])->name('support.index');
        Route::get('support/{ticket}', [\App\Http\Controllers\Superadmin\SupportTicketController::class, 'show'])->name('support.show');
        Route::post('support/{ticket}/reply', [\App\Http\Controllers\Superadmin\SupportTicketController::class, 'reply'])->name('support.reply');
        Route::patch('support/{ticket}/status', [\App\Http\Controllers\Superadmin\SupportTicketController::class, 'updateStatus'])->name('support.status');
        Route::resource('demo-bookings', \App\Http\Controllers\Superadmin\DemoBookingController::class)->only(['index', 'update', 'destroy']);
    });

    // Admin Only Routes
    Route::middleware('role:admin')->group(function () {
        Route::get('reports/export', [\App\Http\Controllers\ReportController::class, 'export'])->name('reports.export');
        Route::get('reports/analytics', [\App\Http\Controllers\ReportController::class, 'analytics'])->name('reports.analytics');
        Route::resource('reports', \App\Http\Controllers\ReportController::class)->only(['index']);
        
        Route::resource('menus', \App\Http\Controllers\MenuController::class)->except(['create', 'edit']);
        Route::resource('categories', \App\Http\Controllers\CategoryController::class)->except(['create', 'edit']);
        Route::resource('addons', \App\Http\Controllers\AddonController::class)->except(['create', 'edit']);
        Route::resource('taxes', \App\Http\Controllers\TaxController::class)->except(['create', 'edit']);
        
        Route::get('staff/performance', [\App\Http\Controllers\ShiftController::class, 'performance'])->name('staff.performance');
        Route::resource('staff', \App\Http\Controllers\StaffController::class)->only(['store', 'update', 'destroy']);
        
        Route::get('/settings', [\App\Http\Controllers\SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [\App\Http\Controllers\SettingController::class, 'update'])->name('settings.update');
        Route::resource('branches', \App\Http\Controllers\BranchController::class)->except(['create', 'edit', 'show']);
        
        Route::get('/my-plan', [\App\Http\Controllers\TenantPlanController::class, 'index'])->name('tenant.plan');
        Route::post('/my-plan/checkout', [\App\Http\Controllers\TenantPlanController::class, 'checkout'])->name('tenant.plan.checkout');
        Route::post('/my-plan/cancel-request/{id}', [\App\Http\Controllers\TenantPlanController::class, 'cancelRequest'])->name('tenant.plan.cancel-request');
        
        Route::get('support', [\App\Http\Controllers\SupportTicketController::class, 'index'])->name('support.index');
        Route::post('support', [\App\Http\Controllers\SupportTicketController::class, 'store'])->name('support.store');
        Route::get('support/{ticket}', [\App\Http\Controllers\SupportTicketController::class, 'show'])->name('support.show');
        Route::post('support/{ticket}/reply', [\App\Http\Controllers\SupportTicketController::class, 'reply'])->name('support.reply');
        Route::patch('support/{ticket}/status', [\App\Http\Controllers\SupportTicketController::class, 'updateStatus'])->name('support.status');
        
        Route::resource('loyalty-rewards', \App\Http\Controllers\LoyaltyRewardController::class)->except(['create', 'edit']);
        Route::resource('banners', \App\Http\Controllers\BannerController::class)->except(['create', 'edit']);
        Route::post('banners/{banner}/toggle-status', [\App\Http\Controllers\BannerController::class, 'toggleStatus'])->name('banners.toggle-status');
        
        // Expenses
        Route::get('/expenses', [\App\Http\Controllers\ExpenseController::class, 'index'])->name('expenses.index');
        Route::post('/expenses', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
        Route::delete('/expenses/{expense}', [\App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expenses.destroy');
        Route::post('/expenses/categories', [\App\Http\Controllers\ExpenseController::class, 'storeCategory'])->name('expenses.categories.store');
        Route::put('/expenses/categories/{category}', [\App\Http\Controllers\ExpenseController::class, 'updateCategory'])->name('expenses.categories.update');
        Route::delete('/expenses/categories/{category}', [\App\Http\Controllers\ExpenseController::class, 'destroyCategory'])->name('expenses.categories.destroy');

        // Finance Reports & Banking
        Route::get('/finance/profit-loss', [\App\Http\Controllers\FinanceController::class, 'profitLoss'])->name('finance.profit-loss');
        Route::get('/finance/banking', [\App\Http\Controllers\FinanceController::class, 'banking'])->name('finance.banking');
        Route::post('/finance/banking', [\App\Http\Controllers\FinanceController::class, 'storeBankAccount'])->name('finance.banking.store');
        Route::put('/finance/banking/{account}', [\App\Http\Controllers\FinanceController::class, 'updateBankAccount'])->name('finance.banking.update');
        Route::delete('/finance/banking/{account}', [\App\Http\Controllers\FinanceController::class, 'destroyBankAccount'])->name('finance.banking.destroy');
        
        // New Finance Features
        Route::get('/finance/accounts', [\App\Http\Controllers\FinanceController::class, 'accounts'])->name('finance.accounts');
        Route::post('/finance/accounts', [\App\Http\Controllers\FinanceController::class, 'storeAccount'])->name('finance.accounts.store');
        Route::get('/finance/journal-entries', [\App\Http\Controllers\FinanceController::class, 'journalEntries'])->name('finance.journal-entries');
        Route::post('/finance/journal-entries', [\App\Http\Controllers\FinanceController::class, 'storeJournalEntry'])->name('finance.journal-entries.store');
        Route::get('/finance/supplier-bills', [\App\Http\Controllers\FinanceController::class, 'supplierBills'])->name('finance.supplier-bills');
        Route::post('/finance/supplier-bills', [\App\Http\Controllers\FinanceController::class, 'storeSupplierBill'])->name('finance.supplier-bills.store');
        Route::post('/finance/supplier-bills/{bill}/pay', [\App\Http\Controllers\FinanceController::class, 'paySupplierBill'])->name('finance.supplier-bills.pay');
        
        // Daily Cash Counter View (Admin Only)
        Route::get('/finance/cash-counter', [\App\Http\Controllers\FinanceController::class, 'cashCounter'])->name('finance.cash-counter');
        Route::get('/finance/balance-sheet', [\App\Http\Controllers\FinanceController::class, 'balanceSheet'])->name('finance.balance-sheet');
        Route::get('/finance/trial-balance', [\App\Http\Controllers\FinanceController::class, 'trialBalance'])->name('finance.trial-balance');
        Route::get('/finance/general-ledger', [\App\Http\Controllers\FinanceController::class, 'generalLedger'])->name('finance.general-ledger');
        Route::get('/finance/cash-flow', [\App\Http\Controllers\FinanceController::class, 'cashFlow'])->name('finance.cash-flow');
        Route::get('/finance/budgets', [\App\Http\Controllers\FinanceController::class, 'budgets'])->name('finance.budgets');
        Route::post('/finance/budgets', [\App\Http\Controllers\FinanceController::class, 'storeBudget'])->name('finance.budgets.store');
        
        Route::get('/inventory', [\App\Http\Controllers\InventoryController::class, 'index'])->name('inventory.index');
        // Items
        Route::post('/inventory/items', [\App\Http\Controllers\InventoryController::class, 'storeItem'])->name('inventory.items.store');
        Route::put('/inventory/items/{item}', [\App\Http\Controllers\InventoryController::class, 'updateItem'])->name('inventory.items.update');
        Route::delete('/inventory/items/{item}', [\App\Http\Controllers\InventoryController::class, 'destroyItem'])->name('inventory.items.destroy');
        // Purchases
        Route::post('/inventory/purchases', [\App\Http\Controllers\InventoryController::class, 'storePurchase'])->name('inventory.purchases.store');
        Route::put('/inventory/purchases/{purchase}', [\App\Http\Controllers\InventoryController::class, 'updatePurchase'])->name('inventory.purchases.update');
        Route::delete('/inventory/purchases/{purchase}', [\App\Http\Controllers\InventoryController::class, 'destroyPurchase'])->name('inventory.purchases.destroy');
        // Usages
        Route::post('/inventory/usages', [\App\Http\Controllers\InventoryController::class, 'storeUsage'])->name('inventory.usages.store');
        Route::put('/inventory/usages/{usage}', [\App\Http\Controllers\InventoryController::class, 'updateUsage'])->name('inventory.usages.update');
        Route::delete('/inventory/usages/{usage}', [\App\Http\Controllers\InventoryController::class, 'destroyUsage'])->name('inventory.usages.destroy');
        // Wastes
        Route::post('/inventory/wastes', [\App\Http\Controllers\InventoryController::class, 'storeWaste'])->name('inventory.wastes.store');
        Route::put('/inventory/wastes/{waste}', [\App\Http\Controllers\InventoryController::class, 'updateWaste'])->name('inventory.wastes.update');
        Route::delete('/inventory/wastes/{waste}', [\App\Http\Controllers\InventoryController::class, 'destroyWaste'])->name('inventory.wastes.destroy');
        // Configuration
        Route::post('/inventory/suppliers', [\App\Http\Controllers\InventoryController::class, 'storeSupplier'])->name('inventory.suppliers.store');
        Route::put('/inventory/suppliers/{supplier}', [\App\Http\Controllers\InventoryController::class, 'updateSupplier'])->name('inventory.suppliers.update');
        Route::delete('/inventory/suppliers/{supplier}', [\App\Http\Controllers\InventoryController::class, 'destroySupplier'])->name('inventory.suppliers.destroy');
        
        Route::post('/inventory/units', [\App\Http\Controllers\InventoryController::class, 'storeUnit'])->name('inventory.units.store');
        Route::put('/inventory/units/{unit}', [\App\Http\Controllers\InventoryController::class, 'updateUnit'])->name('inventory.units.update');
        Route::delete('/inventory/units/{unit}', [\App\Http\Controllers\InventoryController::class, 'destroyUnit'])->name('inventory.units.destroy');
        
        Route::post('/inventory/groups', [\App\Http\Controllers\InventoryController::class, 'storeGroup'])->name('inventory.groups.store');
        Route::put('/inventory/groups/{group}', [\App\Http\Controllers\InventoryController::class, 'updateGroup'])->name('inventory.groups.update');
        Route::delete('/inventory/groups/{group}', [\App\Http\Controllers\InventoryController::class, 'destroyGroup'])->name('inventory.groups.destroy');

        // Recipes (Menu → Ingredient mapping)
        Route::post('/inventory/recipes', [\App\Http\Controllers\InventoryController::class, 'storeRecipe'])->name('inventory.recipes.store');
        Route::delete('/inventory/recipes/{recipe}', [\App\Http\Controllers\InventoryController::class, 'destroyRecipe'])->name('inventory.recipes.destroy');
    });

    // Daily Cash Counter Actions (Admin, Staff, Cashier)
    Route::middleware('role:admin,staff,cashier')->group(function () {
        Route::post('/finance/cash-counter/open', [\App\Http\Controllers\FinanceController::class, 'openCashCounter'])->name('finance.cash-counter.open');
        Route::post('/finance/cash-counter/{session}/close', [\App\Http\Controllers\FinanceController::class, 'closeCashCounter'])->name('finance.cash-counter.close');
    });

    // Staff, Cashier, Waiter & Admin Routes
    Route::middleware('role:admin,staff,cashier,waiter')->group(function () {
        Route::get('/table-book', [\App\Http\Controllers\TableController::class, 'index'])->name('table-book');
        Route::resource('tables', \App\Http\Controllers\TableController::class)->except(['index', 'create', 'edit']);
        Route::resource('reservations', \App\Http\Controllers\ReservationController::class)->except(['create', 'edit']);
        Route::get('service-view', [\App\Http\Controllers\OrderController::class, 'serviceView'])->name('orders.service');
        Route::get('pos/viewer', [\App\Http\Controllers\POSController::class, 'viewer'])->name('pos.viewer');
        Route::post('pos/cash-movement', [\App\Http\Controllers\POSController::class, 'cashMovement'])->name('pos.cash-movement');
        Route::resource('customers', \App\Http\Controllers\CustomerController::class);
        Route::post('customers/{customer}/credit-payment', [\App\Http\Controllers\CreditController::class, 'recordPayment'])->name('customers.credit-payment');
        Route::post('shifts/clock-in', [\App\Http\Controllers\ShiftController::class, 'clockIn'])->name('shifts.clock-in');
        Route::post('shifts/clock-out', [\App\Http\Controllers\ShiftController::class, 'clockOut'])->name('shifts.clock-out');
        Route::resource('orders', \App\Http\Controllers\OrderController::class);
        Route::get('orders/{order}/receipt', [\App\Http\Controllers\OrderController::class, 'receipt'])->name('orders.receipt');
    });

    // Universal Authenticated Routes (Admin, Staff, Kitchen)
    Route::get('kds', [\App\Http\Controllers\OrderController::class, 'kds'])->name('orders.kds');
    Route::post('order-items/{item}/status', [\App\Http\Controllers\OrderController::class, 'updateItemStatus'])->name('order-items.update-status');
    Route::post('order-items/bulk-status', [\App\Http\Controllers\OrderController::class, 'bulkUpdateItemStatus'])->name('order-items.bulk-status');

    Route::get('/media', function () {
        return inertia('Media/Index');
    })->name('media.index');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

// Guest & Public Routes - Moved to bottom to prevent route conflicts
Route::get('{tenant_slug}/qro/{tableNumber}', [\App\Http\Controllers\GuestOrderController::class, 'showMenu'])->name('guest.menu');
Route::post('{tenant_slug}/qro/order/{tableId}', [\App\Http\Controllers\GuestOrderController::class, 'placeOrder'])->name('guest.order');
Route::post('{tenant_slug}/qro/cancel/{item}', [\App\Http\Controllers\GuestOrderController::class, 'cancelItem'])->name('guest.cancel-item');
Route::post('{tenant_slug}/qro/loyalty-check', [\App\Http\Controllers\GuestOrderController::class, 'checkLoyalty'])->name('guest.loyalty-check');
Route::get('{tenant_slug}/book-table', [\App\Http\Controllers\GuestOrderController::class, 'showPublicReservation'])->name('public.reserve');
Route::post('{tenant_slug}/book-table', [\App\Http\Controllers\ReservationController::class, 'store'])->name('public.reserve.store');
