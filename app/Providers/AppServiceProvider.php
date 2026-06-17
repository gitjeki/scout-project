<?php

namespace App\Providers;

<<<<<<< HEAD
=======
use Illuminate\Support\Facades\Vite;
>>>>>>> origin/final
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
<<<<<<< HEAD
        //
=======
        Vite::prefetch(concurrency: 3);
>>>>>>> origin/final
    }
}
