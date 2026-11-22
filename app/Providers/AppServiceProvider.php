<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::define('admin', fn ($user) => $user->hasRole('admin'));

        Gate::define('manager', fn ($user) => $user->hasRole(['admin', 'manager']));
    }
}
