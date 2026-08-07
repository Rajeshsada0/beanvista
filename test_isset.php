<?php
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$col = collect(['a' => 'b']);
var_dump(isset($col['a']));
var_dump(isset($col['b']));
