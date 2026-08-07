<?php

namespace App\Observers;

use App\Models\Tenant;
use App\Models\Account;
use App\Models\ExpenseCategory;

class TenantObserver
{
    /**
     * Handle the Tenant "created" event.
     */
    public function created(Tenant $tenant): void
    {
        $this->seedDefaultAccounts($tenant);
    }

    private function seedDefaultAccounts(Tenant $tenant): void
    {
        $accountsData = [
            ['name' => 'Cash on Hand', 'code' => '1001', 'type' => 'asset', 'is_system_account' => true],
            ['name' => 'Bank Account', 'code' => '1002', 'type' => 'asset', 'is_system_account' => true],
            ['name' => 'Accounts Receivable', 'code' => '1100', 'type' => 'asset', 'is_system_account' => true],
            ['name' => 'Inventory Asset', 'code' => '1200', 'type' => 'asset', 'is_system_account' => true],
            ['name' => 'Accounts Payable', 'code' => '2000', 'type' => 'liability', 'is_system_account' => true],
            ['name' => 'Sales Taxes Payable', 'code' => '2100', 'type' => 'liability', 'is_system_account' => true],
            ['name' => 'Retained Earnings', 'code' => '3000', 'type' => 'equity', 'is_system_account' => true],
            ['name' => 'Sales Revenue', 'code' => '4000', 'type' => 'revenue', 'is_system_account' => true],
            ['name' => 'Cost of Goods Sold', 'code' => '5000', 'type' => 'expense', 'is_system_account' => true],
            ['name' => 'Rent Expense', 'code' => '6001', 'type' => 'expense', 'is_system_account' => false],
            ['name' => 'Salary Expense', 'code' => '6002', 'type' => 'expense', 'is_system_account' => false],
            ['name' => 'Utility Expense', 'code' => '6003', 'type' => 'expense', 'is_system_account' => false],
            ['name' => 'General Expense', 'code' => '6004', 'type' => 'expense', 'is_system_account' => true],
        ];

        foreach ($accountsData as $data) {
            $account = Account::create([
                'tenant_id' => $tenant->id,
                'name' => $data['name'],
                'code' => $data['code'],
                'type' => $data['type'],
                'is_system_account' => $data['is_system_account'],
            ]);

            // Create corresponding expense categories for expense accounts
            if ($data['type'] === 'expense' && $data['code'] >= '6000') {
                ExpenseCategory::create([
                    'tenant_id' => $tenant->id,
                    'name' => $data['name'],
                    'account_id' => $account->id,
                ]);
            }
        }
    }
}
