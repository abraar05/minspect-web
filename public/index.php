<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (file_exists(__DIR__.'/../storage/maintenance.php')) {
    require __DIR__.'/../storage/maintenance.php';
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Request::capture();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
