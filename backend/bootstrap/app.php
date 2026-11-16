<?php

use App\Exceptions\ApiExceptionRenderer;
use App\Exceptions\ApiValidationException;
use App\Exceptions\MalformedJsonException;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\DefaultNoStore;
use App\Http\Middleware\EnsureSupportedMediaType;
use App\Http\Middleware\LimitJsonBody;
use App\Http\Middleware\RejectMalformedJson;
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
        // First in the global stack: every response (404s and errors included) gets X-Request-Id.
        $middleware->prepend(AssignRequestId::class);

        // Cookie-based Sanctum SPA authentication for the Next.js frontend (same origin).
        $middleware->statefulApi();

        // Locally the Next.js dev server proxies /api to this app on 127.0.0.1;
        // trust its X-Forwarded-* headers so client IPs and URLs are the browser's.
        $middleware->trustProxies(at: '127.0.0.1');

        // API guests get a 401 envelope, never a redirect; web guests go to the frontend login page.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/masuk');

        $middleware->alias(['limit_body' => LimitJsonBody::class]);

        $middleware->api(append: [
            DefaultNoStore::class,
            EnsureSupportedMediaType::class,
            LimitJsonBody::class,
            RejectMalformedJson::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Client errors with their own API rendering are not reported as application errors.
        $exceptions->dontReport([ApiValidationException::class, MalformedJsonException::class]);

        // Every exception under /api/* is rendered as the standard error envelope.
        $exceptions->render(
            fn (Throwable $e, Request $request) => app(ApiExceptionRenderer::class)->render($e, $request),
        );

        // Safety net: anything under /api is JSON even without an Accept header.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
