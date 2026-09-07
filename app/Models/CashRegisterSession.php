<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

// Self-heal: Ensure CashRegisterTransaction is always available even if Composer classmap is stale or file was not deployed
if (!class_exists(\App\Models\CashRegisterTransaction::class, false)) {
    $modelFile = __DIR__ . '/CashRegisterTransaction.php';
    if (file_exists($modelFile)) {
        require_once $modelFile;
    }
}

if (!class_exists(\App\Models\CashRegisterTransaction::class, false)) {
    class CashRegisterTransaction extends Model
    {
        use BelongsToTenant, \App\Traits\BelongsToBranch;

        protected $fillable = [
            'tenant_id',
            'branch_id',
            'cash_register_session_id',
            'user_id',
            'type',
            'amount',
            'notes',
            'expense_category_id',
            'expense_id',
        ];

        protected $casts = [
            'amount' => 'decimal:2',
            'created_at' => 'datetime',
        ];

        public function session()
        {
            return $this->belongsTo(CashRegisterSession::class, 'cash_register_session_id');
        }

        public function user()
        {
            return $this->belongsTo(User::class, 'user_id');
        }

        public function category()
        {
            return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
        }

        public function expense()
        {
            return $this->belongsTo(Expense::class, 'expense_id');
        }
    }

    $modelFile = __DIR__ . '/CashRegisterTransaction.php';
    if (!file_exists($modelFile)) {
        @file_put_contents($modelFile, '<?php' . "\n\nnamespace App\Models;\n\nuse App\Traits\BelongsToTenant;\nuse App\Traits\BelongsToBranch;\nuse Illuminate\Database\Eloquent\Model;\n\nclass CashRegisterTransaction extends Model\n{\n    use BelongsToTenant, BelongsToBranch;\n\n    protected \$fillable = [\n        'tenant_id',\n        'branch_id',\n        'cash_register_session_id',\n        'user_id',\n        'type',\n        'amount',\n        'notes',\n        'expense_category_id',\n        'expense_id',\n    ];\n\n    protected \$casts = [\n        'amount' => 'decimal:2',\n        'created_at' => 'datetime',\n    ];\n\n    public function session()\n    {\n        return \$this->belongsTo(CashRegisterSession::class, 'cash_register_session_id');\n    }\n\n    public function user()\n    {\n        return \$this->belongsTo(User::class, 'user_id');\n    }\n\n    public function category()\n    {\n        return \$this->belongsTo(ExpenseCategory::class, 'expense_category_id');\n    }\n\n    public function expense()\n    {\n        return \$this->belongsTo(Expense::class, 'expense_id');\n    }\n}\n");
    }
}

class CashRegisterSession extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'closed_by',
        'opening_balance',
        'expected_balance',
        'closing_balance',
        'discrepancy',
        'opened_at',
        'closed_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'discrepancy' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function transactions()
    {
        return $this->hasMany(CashRegisterTransaction::class, 'cash_register_session_id')->orderBy('created_at', 'desc');
    }

    public function cashOutTransactions()
    {
        return $this->hasMany(CashRegisterTransaction::class, 'cash_register_session_id')->where('type', 'cash_out');
    }

    public function cashInTransactions()
    {
        return $this->hasMany(CashRegisterTransaction::class, 'cash_register_session_id')->where('type', 'cash_in');
    }
}
