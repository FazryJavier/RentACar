<?php

namespace App\Http\Controllers\Api\V1\Admin\MasterData;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Admin\MasterData\Slugger;
use App\Domain\Admin\MasterData\UsageGuard;
use App\Domain\Admin\MasterData\VersionedUpdate;
use App\Http\Requests\Admin\MasterData\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use App\Support\Query\CollectionQuery;
use App\Support\Query\QuerySpec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class CategoryController extends AdminController
{
    public function __construct(
        private readonly Slugger $slugger,
        private readonly VersionedUpdate $versioned,
        private readonly UsageGuard $usage,
        private readonly MasterDataAudit $audit,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $spec = new QuerySpec(
            audience: QuerySpec::AUDIENCE_ADMIN,
            sorts: ['sort_order' => 'sort_order', 'name' => 'name', 'created_at' => 'created_at'],
            defaultSort: 'sort_order',
            searchColumns: ['name'],
            tieBreakers: ['name', 'id'],
        );

        $page = CollectionQuery::fromRequest($request, $spec)->paginate(Category::query());

        return ApiResponse::paginated($page, CategoryResource::collection($page->items())->resolve($request));
    }

    public function show(Request $request, Category $category): JsonResponse
    {
        return ApiResponse::ok(CategoryResource::make($category)->resolve($request));
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $data = $request->safe()->only(['name', 'description', 'sort_order']);

        $category = $this->guardUniqueName(fn () => DB::transaction(fn () => Category::query()->create([
            ...$data,
            'slug' => $this->slugger->unique(Category::class, (string) $data['name']),
        ])), CategoryRequest::NAME_TAKEN);

        $this->audit->record($request, $this->admin($request), 'category', 'created', $category);

        return ApiResponse::created(CategoryResource::make($category->refresh())->resolve($request), 'Kategori disimpan.');
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $values = $request->safe()->only(['name', 'description', 'sort_order']);
        if (isset($values['name']) && $values['name'] !== $category->name) {
            $values['slug'] = $this->slugger->unique(Category::class, (string) $values['name'], $category->id);
        }

        [$category, $changes] = $this->guardUniqueName(
            fn () => $this->versioned->apply($category, $values, $request->integer('version')),
            CategoryRequest::NAME_TAKEN,
        );

        if ($changes !== []) {
            $this->audit->record($request, $this->admin($request), 'category', 'updated', $category, $changes);
        }

        return ApiResponse::ok(CategoryResource::make($category)->resolve($request), 'Kategori disimpan.');
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->usage->deleteUnlessUsed($category, 'Kategori', [
            'cars' => ['label' => 'mobil', 'count' => fn (): int => $category->cars()->withTrashed()->count()],
        ]);

        $this->audit->record($request, $this->admin($request), 'category', 'deleted', $category);

        return ApiResponse::ok(null, 'Kategori dihapus.');
    }
}
