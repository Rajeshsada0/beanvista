<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tables = ['tables','floor_areas','orders','reservations','shifts','cash_register_sessions','expenses','bank_accounts','journal_entries'];

foreach($tables as $t){
    if(\Illuminate\Support\Facades\Schema::hasTable($t)){
        $cols = \Illuminate\Support\Facades\Schema::getColumnListing($t);
        echo $t . ': ' . implode(', ', $cols) . PHP_EOL;
    } else {
        echo $t . ': TABLE MISSING' . PHP_EOL;
    }
}
