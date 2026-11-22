<?php

use App\Http\Controllers\Api\Admin\AllowedGoogleAccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::prefix('admin')->group(function () {
        Route::get('/allowed-google-accounts', [AllowedGoogleAccountController::class, 'index']);
        Route::post('/allowed-google-accounts', [AllowedGoogleAccountController::class, 'store']);
        Route::patch('/allowed-google-accounts/{allowed_google_account}', [AllowedGoogleAccountController::class, 'update']);
        Route::delete('/allowed-google-accounts/{allowed_google_account}', [AllowedGoogleAccountController::class, 'destroy']);
    });
});
