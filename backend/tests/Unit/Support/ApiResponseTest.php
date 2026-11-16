<?php

use App\Support\ApiResponse;
use App\Support\Http\ApiError;
use Illuminate\Pagination\LengthAwarePaginator;

it('builds a 200 envelope', function () {
    $response = ApiResponse::ok(['id' => 1], 'Detail berhasil diambil.');

    expect($response->getStatusCode())->toBe(200)
        ->and($response->getData(true))->toBe([
            'code' => 200,
            'success' => true,
            'message' => 'Detail berhasil diambil.',
            'data' => ['id' => 1],
            'errors' => null,
            'meta' => null,
        ]);
});

it('builds created and accepted envelopes with matching code', function () {
    expect(ApiResponse::created(['id' => 2])->getData(true))->toMatchArray(['code' => 201, 'success' => true])
        ->and(ApiResponse::created()->getStatusCode())->toBe(201)
        ->and(ApiResponse::accepted()->getStatusCode())->toBe(202)
        ->and(ApiResponse::accepted()->getData(true)['code'])->toBe(202);
});

it('allows a success without payload', function () {
    expect(ApiResponse::ok()->getData(true))->toMatchArray(['code' => 200, 'success' => true, 'data' => null, 'errors' => null]);
});

it('puts pagination into meta', function () {
    $paginator = new LengthAwarePaginator(array_fill(0, 12, ['x' => 1]), 30, 12, 2);

    $body = ApiResponse::paginated($paginator)->getData(true);

    expect($body['data'])->toHaveCount(12)
        ->and($body['meta'])->toBe(['page' => 2, 'per_page' => 12, 'total' => 30, 'total_pages' => 3]);
});

it('reports zero total pages for an empty collection', function () {
    $body = ApiResponse::paginated(new LengthAwarePaginator([], 0, 12, 1))->getData(true);

    expect($body['data'])->toBe([])
        ->and($body['meta'])->toBe(['page' => 1, 'per_page' => 12, 'total' => 0, 'total_pages' => 0]);
});

it('builds an error envelope with structured errors', function () {
    $response = ApiResponse::error(409, 'Konflik.', [
        new ApiError(null, 'conflict', 'Konflik.'),
        new ApiError('price', 'price_changed', 'Harga berubah.', ['total' => 100]),
    ]);

    expect($response->getStatusCode())->toBe(409)
        ->and($response->getData(true))->toBe([
            'code' => 409,
            'success' => false,
            'message' => 'Konflik.',
            'data' => null,
            'errors' => [
                ['field' => null, 'code' => 'conflict', 'message' => 'Konflik.'],
                ['field' => 'price', 'code' => 'price_changed', 'message' => 'Harga berubah.', 'details' => ['total' => 100]],
            ],
            'meta' => null,
        ]);
});
