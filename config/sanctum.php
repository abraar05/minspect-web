<?php

return [
    'stateful' => array_filter(array_map('trim', explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', '')))),
    'guard' => ['web'],
    'expiration' => (int) env('SANCTUM_TOKEN_EXPIRATION', 0) ?: null,
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),
    'middleware' => [
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
        'session' => Illuminate\Session\Middleware\StartSession::class,
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
    ],
];
