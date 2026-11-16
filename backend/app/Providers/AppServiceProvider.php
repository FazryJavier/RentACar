<?php

namespace App\Providers;

use Illuminate\Foundation\DevCommands;
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
        $this->registerDevCommands();
    }

    /**
     * Processes started by `composer dev` (`php artisan dev`) for native local development.
     * The Next.js frontend proxies /api, /sanctum, /docs and /storage to this server.
     */
    private function registerDevCommands(): void
    {
        if (! $this->app->runningInConsole() || $this->app->environment('production')) {
            return;
        }

        DevCommands::artisan('serve --host=127.0.0.1 --port=8000', 'server');
        DevCommands::artisan('schedule:work', 'scheduler');
    }
}
