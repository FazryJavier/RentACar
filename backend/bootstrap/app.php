<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Cookie-based Sanctum SPA authentication for the Next.js frontend (same origin).
        $middleware->statefulApi();

        // Locally the Next.js dev server proxies /api to this app on 127.0.0.1;
        // trust its X-Forwarded-* headers so generated URLs use the browser origin.
        $middleware->trustProxies(at: '127.0.0.1');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Errors under /api are always JSON, even without an Accept header.
        // The full standard error envelope is added in US-02.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
