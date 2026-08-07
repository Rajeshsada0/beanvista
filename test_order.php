<?php
require __DIR__.'/vendor/autoload.php';
\ = require_once __DIR__.'/bootstrap/app.php';
\ = \->make(Illuminate\Contracts\Console\Kernel::class);
\->bootstrap();

\ = App\Models\Order::find(53);
if (\) {
    \ = new App\Http\Controllers\OrderController();
    \ = new \Illuminate\Http\Request();
    \->merge([
        'status' => 'completed',
        'cash_amount' => 0,
        'online_amount' => 13,
        'bank_account_id' => 3
    ]);
    
    \->updateStatus(\, \);
    echo 'Done.\n';
} else {
    echo 'Order not found.\n';
}
