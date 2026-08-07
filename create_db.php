<?php
$p = new PDO('mysql:host=127.0.0.1;port=3306', 'root', '');
$p->exec('CREATE DATABASE IF NOT EXISTS cafeapp');
echo "Database created successfully.\n";
