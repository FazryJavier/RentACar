<?php

use App\Support\ApiResponse;
use App\Support\Query\CollectionQuery;
use App\Support\Query\QuerySpec;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Tests\Fixtures\QueryTestItem;

beforeEach(function () {
    Schema::create('query_test_items', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('status');
        $table->integer('price');
        $table->timestamps();
    });

    $rows = [];
    for ($i = 1; $i <= 30; $i++) {
        $rows[] = [
            'name' => sprintf('Mobil %02d', $i),
            'status' => $i % 3 === 0 ? 'inactive' : 'active',
            'price' => $i * 1000,
            'created_at' => now()->addMinutes($i),
            'updated_at' => now(),
        ];
    }
    $rows[] = ['name' => 'Diskon 50%_spesial', 'status' => 'active', 'price' => 1, 'created_at' => now(), 'updated_at' => now()];
    QueryTestItem::query()->insert($rows);

    $spec = fn (string $audience) => new QuerySpec(
        audience: $audience,
        sorts: ['name' => 'name', 'price' => 'price', 'created_at' => 'created_at'],
        defaultSort: 'name',
        searchColumns: ['name'],
        filters: ['status' => 'status', 'min_price' => fn ($query, $value) => $query->where('price', '>=', (int) $value)],
    );

    Route::middleware('api')->prefix('api/test')->group(function () use ($spec) {
        Route::get('items', function (Request $request) use ($spec) {
            return ApiResponse::paginated(CollectionQuery::fromRequest($request, $spec('public'))->paginate(QueryTestItem::query()));
        });
        Route::get('admin-items', function (Request $request) use ($spec) {
            return ApiResponse::paginated(CollectionQuery::fromRequest($request, $spec('admin'))->paginate(QueryTestItem::query()));
        });
    });
});

afterEach(function () {
    Schema::dropIfExists('query_test_items');
});

it('uses public defaults', function () {
    $this->getJson('/api/test/items')
        ->assertOk()
        ->assertJsonPath('meta', ['page' => 1, 'per_page' => 12, 'total' => 31, 'total_pages' => 3])
        ->assertJsonCount(12, 'data');
});

it('falls back to the default page size for disallowed values', function (mixed $perPage) {
    $this->getJson('/api/test/items?per_page='.$perPage)->assertOk()->assertJsonPath('meta.per_page', 12);
})->with([1000, 'abc', 10, -1]);

it('accepts admin page sizes', function () {
    $this->getJson('/api/test/admin-items?per_page=100')->assertOk()->assertJsonPath('meta.per_page', 100);
    $this->getJson('/api/test/admin-items')->assertOk()->assertJsonPath('meta.per_page', 25);
    $this->getJson('/api/test/admin-items?per_page=48')->assertOk()->assertJsonPath('meta.per_page', 25);
});

it('returns an empty page beyond the last page', function () {
    $this->getJson('/api/test/items?page=99')
        ->assertOk()
        ->assertJsonPath('data', [])
        ->assertJsonPath('meta.page', 99)
        ->assertJsonPath('meta.total', 31);
});

it('falls back to page 1 for invalid page values', function () {
    $this->getJson('/api/test/items?page=-3')->assertOk()->assertJsonPath('meta.page', 1);
});

it('sorts ascending and descending on allowed fields', function () {
    $asc = $this->getJson('/api/test/items?sort=price&filter[status]=active')->json('data');
    $desc = $this->getJson('/api/test/items?sort=-price&filter[status]=active')->json('data');

    expect($asc[0]['price'])->toBe(1)
        ->and($desc[0]['price'])->toBe(29000);
});

it('falls back to the default sort for disallowed or malicious values', function (string $sort) {
    $names = collect($this->getJson('/api/test/items?sort='.urlencode($sort))->assertOk()->json('data'))->pluck('name');

    expect($names->first())->toBe('Diskon 50%_spesial');
})->with(['password', 'name;drop table query_test_items', '-id--']);

it('rejects a search term that is too short or too long', function () {
    $this->getJson('/api/test/items?q=a')
        ->assertStatus(422)
        ->assertJsonPath('errors.0.field', 'q')
        ->assertJsonPath('errors.0.code', 'too_short');

    $this->getJson('/api/test/items?q='.str_repeat('a', 101))
        ->assertStatus(422)
        ->assertJsonPath('errors.0.code', 'too_long');
});

it('searches case-insensitively', function () {
    $this->getJson('/api/test/items?q=mobil%2001')->assertOk()->assertJsonPath('meta.total', 1);
});

it('treats LIKE wildcards literally', function () {
    $response = $this->getJson('/api/test/items?q='.urlencode('50%_'));

    $response->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.name', 'Diskon 50%_spesial');
    $this->getJson('/api/test/items?q='.urlencode('%%'))->assertOk()->assertJsonPath('meta.total', 0);
});

it('applies allowed filters', function () {
    $this->getJson('/api/test/items?filter[status]=inactive')->assertOk()->assertJsonPath('meta.total', 10);
    $this->getJson('/api/test/items?filter[min_price]=25000')->assertOk()->assertJsonPath('meta.total', 6);
});

it('rejects unknown filter keys', function () {
    $this->getJson('/api/test/items?filter[secret]=1')
        ->assertStatus(422)
        ->assertJsonPath('errors.0.field', 'filter.secret')
        ->assertJsonPath('errors.0.code', 'unknown_filter');
});

it('rejects a non-array filter parameter', function () {
    $this->getJson('/api/test/items?filter=status')
        ->assertStatus(422)
        ->assertJsonPath('errors.0.field', 'filter')
        ->assertJsonPath('errors.0.code', 'invalid_format');
});
