<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\DevCommands;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
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
        $this->registerRateLimiters();
        $this->registerApiDocsGate();
        $this->registerDevCommands();
    }

    /**
     * Named limiters (Spesifikasi API §4.3). Attach to routes with `throttle:<name>`.
     * They use the configured cache store, so they work with `database` or `redis`.
     */
    private function registerRateLimiters(): void
    {
        RateLimiter::for('public', fn (Request $request) => Limit::perMinute(60)->by('ip:'.$request->ip()));

        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(5)->by(
            'auth:'.$request->ip().'|'.mb_strtolower(trim((string) $request->input('email'))),
        ));

        RateLimiter::for('booking-create', fn (Request $request) => Limit::perHour(10)->by($this->userKey($request)));

        RateLimiter::for('payment-upload', fn (Request $request) => Limit::perHour(10)->by($this->userKey($request)));

        RateLimiter::for('customer', fn (Request $request) => Limit::perMinute(120)->by($this->userKey($request)));

        RateLimiter::for('admin', fn (Request $request) => Limit::perMinute(300)->by($this->userKey($request)));

        RateLimiter::for('telemetry', fn (Request $request) => Limit::perMinute(60)->by(
            'device:'.($request->attributes->get('gps_device_id') ?? $request->ip()),
        ));
    }

    private function userKey(Request $request): string
    {
        $id = Auth::id();

        return $id !== null ? 'user:'.$id : 'ip:'.$request->ip();
    }

    /**
     * Scramble already allows `local`. Every other environment is denied until
     * admin authentication exists (US-07 opens the docs to admins on the demo).
     */
    private function registerApiDocsGate(): void
    {
        Gate::define('viewApiDocs', fn ($user = null): bool => false);
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
