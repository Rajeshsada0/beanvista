<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

// Bootstrap using the Console Kernel
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Account;
use App\Models\BankAccount;
use App\Models\User;

header('Content-Type: text/plain');

try {
    echo "--- BANK ACCOUNT CREATION DIAGNOSTIC ---\n";
    echo "1. Checking database connection and retrieving first user...\n";
    $user = User::first();
    if (!$user) {
        throw new Exception("No user found in the database. Please register/create a user first.");
    }
    echo "   Using User: " . $user->email . "\n";
    echo "   Tenant ID: " . $user->tenant_id . "\n";
    echo "   Primary Branch ID: " . ($user->primary_branch_id ?? 'NULL') . "\n\n";
    
    // Authenticate as this user
    auth()->login($user);
    
    echo "2. Attempting to create GL Account (accounts table)...\n";
    $glAccount = Account::create([
        'tenant_id' => $user->tenant_id,
        'name' => 'Diagnostic GL Account (Bank)',
        'code' => '100' . rand(10, 99),
        'type' => 'asset',
        'description' => 'Diagnostic test'
    ]);
    echo "   SUCCESS: Created GL Account ID " . $glAccount->id . "\n\n";
    
    echo "3. Attempting to create Bank Account (bank_accounts table)...\n";
    $bankAccount = BankAccount::create([
        'tenant_id' => $user->tenant_id,
        'account_name' => 'Diagnostic Bank',
        'account_number' => '123456789',
        'bank_name' => 'Diagnostic Bank Name',
        'account_type' => 'cash',
        'gl_account_id' => $glAccount->id,
        'balance' => 0.0,
    ]);
    echo "   SUCCESS: Created Bank Account ID " . $bankAccount->id . "\n\n";
    
    echo "4. Cleaning up diagnostic records...\n";
    $bankAccount->delete();
    $glAccount->delete();
    echo "   SUCCESS: Cleanup complete.\n\n";
    
    echo "DIAGNOSTIC STATUS: ALL OK. The database transaction works perfectly on this schema.\n";
    
} catch (Exception $e) {
    echo "\nDIAGNOSTIC STATUS: FAILED\n";
    echo "========================================\n";
    echo "ERROR MESSAGE: " . $e->getMessage() . "\n";
    echo "FILE: " . $e->getFile() . " on line " . $e->getLine() . "\n";
    echo "========================================\n";
    echo "STACK TRACE:\n" . $e->getTraceAsString() . "\n";
}
