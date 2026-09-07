<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApiController;
use App\Http\Middleware\ApiTokenAuth;

// Public routes
Route::post('/auth/login', [ApiController::class, 'login']);
Route::post('/auth/register', [ApiController::class, 'register']);
Route::post('/auth/forgot-password', [ApiController::class, 'forgotPassword']);
Route::get('/public-settings', [ApiController::class, 'getPublicSettings']);
Route::get('/serve-media', [ApiController::class, 'serveMedia']);

// Authenticated routes
Route::middleware(ApiTokenAuth::class)->group(function () {
    Route::post('/auth/logout', [ApiController::class, 'logout']);
    Route::post('/auth/profile', [ApiController::class, 'updateProfile']);
    Route::get('/auth/user', [ApiController::class, 'getUser']);
    Route::post('/auth/email/verification-notification', [ApiController::class, 'resendVerificationEmail']);
    Route::get('/dashboard', [ApiController::class, 'dashboard']);
    Route::get('/tables', [ApiController::class, 'tables']);
    Route::post('/tables', [ApiController::class, 'createTable']);
    Route::put('/tables/{id}', [ApiController::class, 'updateTable']);
    Route::delete('/tables/{id}', [ApiController::class, 'deleteTable']);
    Route::get('/tables/{id}/qr', [ApiController::class, 'getTableQr']);
    Route::get('/menus', [ApiController::class, 'menus']);
    Route::post('/menus', [ApiController::class, 'createMenu']);
    Route::put('/menus/{id}', [ApiController::class, 'updateMenu']);
    Route::delete('/menus/{id}', [ApiController::class, 'deleteMenu']);
    Route::get('/categories', [ApiController::class, 'categories']);
    Route::post('/categories', [ApiController::class, 'createCategory']);
    Route::put('/categories/{id}', [ApiController::class, 'updateCategory']);
    Route::delete('/categories/{id}', [ApiController::class, 'deleteCategory']);
    Route::get('/orders', [ApiController::class, 'orders']);
    Route::post('/orders', [ApiController::class, 'createOrder']);
    Route::get('/orders/{id}', [ApiController::class, 'showOrder']);
    Route::patch('/orders/{id}', [ApiController::class, 'updateOrder']);
    Route::post('/order-items/{id}/status', [ApiController::class, 'updateItemStatus']);
    Route::post('/order-items/bulk-status', [ApiController::class, 'bulkUpdateItemStatus']);
    Route::get('/customers', [ApiController::class, 'customers']);
    Route::post('/customers', [ApiController::class, 'createCustomer']);
    Route::put('/customers/{id}', [ApiController::class, 'updateCustomer']);
    Route::get('/customers/{id}', [ApiController::class, 'showCustomer']);
    Route::post('/customers/{id}/payment', [ApiController::class, 'recordCustomerPayment']);
    Route::get('/bank-accounts', [ApiController::class, 'bankAccounts']);
    Route::get('/settings', [ApiController::class, 'getSettings']);
    Route::post('/settings', [ApiController::class, 'updateSettings']);

    // Loyalty Rewards
    Route::get('/loyalty-rewards', [ApiController::class, 'loyaltyRewards']);
    Route::post('/loyalty-rewards', [ApiController::class, 'createLoyaltyReward']);
    Route::put('/loyalty-rewards/{id}', [ApiController::class, 'updateLoyaltyReward']);
    Route::delete('/loyalty-rewards/{id}', [ApiController::class, 'deleteLoyaltyReward']);
    Route::patch('/loyalty-rewards/{id}/status', [ApiController::class, 'toggleLoyaltyRewardStatus']);
    Route::post('/loyalty-rewards/redeem', [ApiController::class, 'redeemLoyaltyReward']);

    // Inventory
    Route::get('/inventory', [ApiController::class, 'getInventory']);
    Route::post('/inventory/items', [ApiController::class, 'storeInventoryItem']);
    Route::put('/inventory/items/{id}', [ApiController::class, 'updateInventoryItem']);
    Route::delete('/inventory/items/{id}', [ApiController::class, 'deleteInventoryItem']);
    Route::post('/inventory/purchases', [ApiController::class, 'storeInventoryPurchase']);
    Route::post('/inventory/usages', [ApiController::class, 'storeInventoryUsage']);
    Route::post('/inventory/wastes', [ApiController::class, 'storeInventoryWaste']);
    Route::put('/inventory/wastes/{id}', [ApiController::class, 'updateInventoryWaste']);
    Route::delete('/inventory/wastes/{id}', [ApiController::class, 'deleteInventoryWaste']);
    Route::post('/inventory/suppliers', [ApiController::class, 'storeInventorySupplier']);
    Route::put('/inventory/suppliers/{id}', [ApiController::class, 'updateInventorySupplier']);
    Route::delete('/inventory/suppliers/{id}', [ApiController::class, 'deleteInventorySupplier']);
    Route::post('/inventory/recipes', [ApiController::class, 'storeInventoryRecipe']);
    Route::post('/inventory/units', [ApiController::class, 'storeMeasuringUnit']);
    Route::put('/inventory/units/{id}', [ApiController::class, 'updateMeasuringUnit']);
    Route::delete('/inventory/units/{id}', [ApiController::class, 'deleteMeasuringUnit']);
    Route::post('/inventory/groups', [ApiController::class, 'storeStockGroup']);
    Route::put('/inventory/groups/{id}', [ApiController::class, 'updateStockGroup']);
    Route::delete('/inventory/groups/{id}', [ApiController::class, 'deleteStockGroup']);

    // Reservations
    Route::get('/reservations', [ApiController::class, 'getReservations']);
    Route::post('/reservations', [ApiController::class, 'storeReservation']);
    Route::put('/reservations/{id}', [ApiController::class, 'updateReservation']);
    Route::delete('/reservations/{id}', [ApiController::class, 'deleteReservation']);

    // Finance Routes
    Route::get('/finance/overview', [ApiController::class, 'getFinanceOverview']);
    Route::get('/finance/profit-loss', [ApiController::class, 'getProfitLoss']);
    Route::get('/finance/balance-sheet', [ApiController::class, 'getBalanceSheet']);
    Route::get('/finance/trial-balance', [ApiController::class, 'getTrialBalance']);
    Route::get('/finance/cash-flow', [ApiController::class, 'getCashFlow']);
    Route::get('/finance/general-ledger', [ApiController::class, 'getGeneralLedger']);
    
    Route::get('/finance/accounts', [ApiController::class, 'getChartOfAccounts']);
    Route::post('/finance/accounts', [ApiController::class, 'storeAccount']);
    
    Route::get('/finance/journal-entries', [ApiController::class, 'getJournalEntries']);
    Route::post('/finance/journal-entries', [ApiController::class, 'storeJournalEntry']);
    
    Route::get('/finance/expenses', [ApiController::class, 'getExpenses']);
    Route::post('/finance/expenses', [ApiController::class, 'storeExpense']);
    Route::delete('/finance/expenses/{id}', [ApiController::class, 'destroyExpense']);
    Route::get('/finance/expense-categories', [ApiController::class, 'getExpenseCategories']);
    Route::post('/finance/expense-categories', [ApiController::class, 'storeExpenseCategory']);
    Route::put('/finance/expense-categories/{id}', [ApiController::class, 'updateExpenseCategory']);
    Route::delete('/finance/expense-categories/{id}', [ApiController::class, 'destroyExpenseCategory']);
    
    Route::get('/finance/supplier-bills', [ApiController::class, 'getSupplierBills']);
    Route::post('/finance/supplier-bills', [ApiController::class, 'storeSupplierBill']);
    Route::post('/finance/supplier-bills/{bill}/pay', [ApiController::class, 'paySupplierBill']);
    
    Route::get('/finance/budgets', [ApiController::class, 'getBudgets']);
    Route::post('/finance/budgets', [ApiController::class, 'storeBudget']);
    
    Route::get('/finance/banking', [ApiController::class, 'getBanking']);
    Route::post('/finance/bank-accounts', [ApiController::class, 'storeBankAccount']);
    Route::match(['PUT', 'POST'], '/finance/bank-accounts/{id}', [ApiController::class, 'updateBankAccount']);
    Route::delete('/finance/bank-accounts/{id}', [ApiController::class, 'deleteBankAccount']);
    
    Route::get('/finance/cash-counter', [ApiController::class, 'getCashCounter']);
    Route::post('/finance/cash-counter/open', [ApiController::class, 'openCashCounter']);
    Route::post('/finance/cash-counter/close/{session}', [ApiController::class, 'closeCashCounter']);
    Route::post('/finance/cash-counter/{session}/close', [ApiController::class, 'closeCashCounter']);
    Route::post('/finance/cash-counter/transaction', [ApiController::class, 'storeCashCounterTransaction']);
    Route::delete('/finance/cash-counter/transaction/{id}', [ApiController::class, 'destroyCashCounterTransaction']);

    // Reports
    Route::get('/reports', [ApiController::class, 'getReports']);
    Route::get('/reports/export', [ApiController::class, 'exportReports']);

    // Taxes
    Route::get('/taxes', [ApiController::class, 'getTaxes']);
    Route::post('/taxes', [ApiController::class, 'storeTax']);
    Route::put('/taxes/{id}', [ApiController::class, 'updateTax']);
    Route::delete('/taxes/{id}', [ApiController::class, 'deleteTax']);

    // Subscriptions / My Plan
    Route::get('/subscription', [ApiController::class, 'getSubscription']);
    Route::post('/subscription/checkout', [ApiController::class, 'checkoutSubscription']);
    Route::delete('/subscription/cancel-request/{id}', [ApiController::class, 'cancelSubscriptionRequest']);
    Route::get('/payment-method/{id}/qr', [ApiController::class, 'getPaymentMethodQr']);

    // Branches
    Route::get('/branches', [ApiController::class, 'getBranches']);
    Route::post('/branches', [ApiController::class, 'storeBranch']);
    Route::put('/branches/{id}', [ApiController::class, 'updateBranch']);
    Route::delete('/branches/{id}', [ApiController::class, 'deleteBranch']);
    Route::post('/branches/switch', [ApiController::class, 'switchBranch']);

    // Support Tickets
    Route::get('/support/tickets', [ApiController::class, 'getSupportTickets']);
    Route::post('/support/tickets', [ApiController::class, 'storeSupportTicket']);
    Route::get('/support/tickets/{id}', [ApiController::class, 'showSupportTicket']);
    Route::post('/support/tickets/{id}/reply', [ApiController::class, 'replySupportTicket']);
    Route::put('/support/tickets/{id}/status', [ApiController::class, 'updateSupportTicketStatus']);

    // Staff Management & Performance
    Route::get('/staff/performance', [ApiController::class, 'getStaffPerformance']);
    Route::post('/staff', [ApiController::class, 'createStaff']);
    Route::put('/staff/{id}', [ApiController::class, 'updateStaff']);
    Route::delete('/staff/{id}', [ApiController::class, 'deleteStaff']);

    // Media Gallery API Routes
    Route::get('/media', [\App\Http\Controllers\MediaController::class, 'index']);
    Route::post('/media/upload', [\App\Http\Controllers\MediaController::class, 'upload']);
    Route::post('/media/rename', [\App\Http\Controllers\MediaController::class, 'rename']);
    Route::post('/media/delete', [\App\Http\Controllers\MediaController::class, 'delete']);

    // Superadmin API Routes
    Route::delete('/superadmin/tenants/{id}', [ApiController::class, 'deleteTenant']);
});

