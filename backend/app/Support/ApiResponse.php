<?php

namespace App\Support;

use App\Support\Http\ApiError;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;

/**
 * Builds every API response with the project envelope:
 * {code, success, message, data, errors, meta}.
 *
 * - `code` always equals the HTTP status.
 * - `errors` is null on success and a non-empty list on failure.
 * - `meta` is null unless documented metadata (pagination, debug) exists.
 */
final class ApiResponse
{
    /**
     * @param  array<string, string>  $headers
     */
    public static function ok(mixed $data = null, string $message = 'Berhasil.', int $status = 200, array $headers = []): JsonResponse
    {
        return self::success($status, $message, $data, null, $headers);
    }

    /**
     * @param  array<string, string>  $headers
     */
    public static function created(mixed $data = null, string $message = 'Data berhasil dibuat.', array $headers = []): JsonResponse
    {
        return self::success(201, $message, $data, null, $headers);
    }

    /**
     * @param  array<string, string>  $headers
     */
    public static function accepted(mixed $data = null, string $message = 'Permintaan diterima.', array $headers = []): JsonResponse
    {
        return self::success(202, $message, $data, null, $headers);
    }

    /**
     * @param  LengthAwarePaginator<array-key, mixed>  $paginator
     * @param  array<int, mixed>|null  $items  Transformed items; defaults to the paginator items.
     */
    public static function paginated(LengthAwarePaginator $paginator, ?array $items = null, string $message = 'Data berhasil diambil.'): JsonResponse
    {
        $total = $paginator->total();

        return self::success(200, $message, $items ?? array_values($paginator->items()), [
            'page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $total,
            'total_pages' => $total === 0 ? 0 : $paginator->lastPage(),
        ]);
    }

    /**
     * @param  list<ApiError>  $errors
     * @param  array<string, mixed>|null  $meta
     * @param  array<string, string|list<string>|null>  $headers
     */
    public static function error(int $status, string $message, array $errors, ?array $meta = null, array $headers = []): JsonResponse
    {
        return new JsonResponse([
            'code' => $status,
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => array_map(static fn (ApiError $error): array => $error->toArray(), $errors),
            'meta' => $meta,
        ], $status, $headers);
    }

    /**
     * @param  array<string, mixed>|null  $meta
     * @param  array<string, string>  $headers
     */
    private static function success(int $status, string $message, mixed $data, ?array $meta, array $headers = []): JsonResponse
    {
        return new JsonResponse([
            'code' => $status,
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
            'meta' => $meta,
        ], $status, $headers);
    }
}
