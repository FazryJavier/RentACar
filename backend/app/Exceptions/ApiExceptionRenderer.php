<?php

namespace App\Exceptions;

use App\Support\ApiResponse;
use App\Support\Http\ApiError;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Renders every exception raised for /api/* as the standard error envelope.
 *
 * Laravel passes the *prepared* exception here (e.g. ModelNotFoundException is already a
 * NotFoundHttpException, TokenMismatchException an HttpException(419)), so most cases map
 * by HTTP status. Messages come from ErrorCatalog and never expose internal details.
 */
final class ApiExceptionRenderer
{
    private const EXCLUSION_VIOLATION = '23P01';

    public function __construct(private readonly ValidationErrorMapper $validationMapper) {}

    public function render(Throwable $e, Request $request): ?JsonResponse
    {
        if (! $request->is('api/*') || $e instanceof HttpResponseException) {
            return null;
        }

        return match (true) {
            $e instanceof ApiRenderable => ApiResponse::error(
                $e->apiStatus(),
                $e->apiMessage(),
                $e->apiErrors(),
                $this->debugMeta($e, $e->apiStatus()),
            ),
            $e instanceof ValidationException => ApiResponse::error(
                422,
                ErrorCatalog::message(ErrorCatalog::VALIDATION_FAILED),
                $this->validationMapper->map($e),
            ),
            $e instanceof AuthenticationException => $this->simple(401, ErrorCatalog::UNAUTHENTICATED, $e),
            $e instanceof MalformedJsonException => $this->simple(400, ErrorCatalog::MALFORMED_JSON, $e),
            $e instanceof QueryException && $e->getCode() === self::EXCLUSION_VIOLATION => $this->simple(409, ErrorCatalog::CONFLICT, $e),
            $e instanceof HttpExceptionInterface => $this->simple(
                $e->getStatusCode(),
                ErrorCatalog::codeForStatus($e->getStatusCode()),
                $e,
                $e->getHeaders(),
            ),
            default => $this->simple(500, ErrorCatalog::INTERNAL_ERROR, $e),
        };
    }

    /**
     * @param  array<string, string|list<string>|null>  $headers
     */
    private function simple(int $status, string $code, Throwable $e, array $headers = []): JsonResponse
    {
        $message = ErrorCatalog::message($code);

        return ApiResponse::error(
            $status,
            $message,
            [new ApiError(null, $code, $message)],
            $this->debugMeta($e, $status),
            $headers,
        );
    }

    /**
     * Debug details only when APP_DEBUG=true and only for server-side failures.
     * Never includes file paths or stack traces.
     *
     * @return array{debug: array{exception: class-string, message: string}}|null
     */
    private function debugMeta(Throwable $e, int $status): ?array
    {
        if (! config('app.debug') || ($status < 500 && ! $e instanceof QueryException)) {
            return null;
        }

        return ['debug' => ['exception' => $e::class, 'message' => $e->getMessage()]];
    }
}
