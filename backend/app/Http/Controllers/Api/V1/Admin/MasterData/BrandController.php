<?php

namespace App\Http\Controllers\Api\V1\Admin\MasterData;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Admin\MasterData\Slugger;
use App\Domain\Admin\MasterData\UsageGuard;
use App\Domain\Admin\MasterData\VersionedUpdate;
use App\Http\Requests\Admin\MasterData\BrandRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use App\Support\ApiResponse;
use App\Support\Query\CollectionQuery;
use App\Support\Query\QuerySpec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

final class BrandController extends AdminController
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
            sorts: ['name' => 'name', 'created_at' => 'created_at', 'updated_at' => 'updated_at'],
            defaultSort: 'name',
            searchColumns: ['name'],
        );

        $page = CollectionQuery::fromRequest($request, $spec)->paginate(Brand::query());

        return ApiResponse::paginated($page, BrandResource::collection($page->items())->resolve($request));
    }

    public function show(Request $request, Brand $brand): JsonResponse
    {
        return ApiResponse::ok(BrandResource::make($brand)->resolve($request));
    }

    public function store(BrandRequest $request): JsonResponse
    {
        $name = $request->string('name')->toString();

        $brand = $this->guardUniqueName(fn () => DB::transaction(fn () => Brand::query()->create([
            'name' => $name,
            'slug' => $this->slugger->unique(Brand::class, $name),
        ])), BrandRequest::NAME_TAKEN);

        $this->audit->record($request, $this->admin($request), 'brand', 'created', $brand);

        return ApiResponse::created(BrandResource::make($brand->refresh())->resolve($request), 'Merek disimpan.');
    }

    public function update(BrandRequest $request, Brand $brand): JsonResponse
    {
        $values = $request->safe()->only(['name']);
        if (isset($values['name']) && $values['name'] !== $brand->name) {
            $values['slug'] = $this->slugger->unique(Brand::class, (string) $values['name'], $brand->id);
        }

        [$brand, $changes] = $this->guardUniqueName(
            fn () => $this->versioned->apply($brand, $values, $request->integer('version')),
            BrandRequest::NAME_TAKEN,
        );

        if ($changes !== []) {
            $this->audit->record($request, $this->admin($request), 'brand', 'updated', $brand, $changes);
        }

        return ApiResponse::ok(BrandResource::make($brand)->resolve($request), 'Merek disimpan.');
    }

    public function destroy(Request $request, Brand $brand): JsonResponse
    {
        $logo = $brand->logo_path;

        $this->usage->deleteUnlessUsed($brand, 'Merek', [
            'cars' => ['label' => 'mobil', 'count' => fn (): int => $brand->cars()->withTrashed()->count()],
        ]);

        if ($logo !== null) {
            Storage::disk('public')->delete($logo);
        }

        $this->audit->record($request, $this->admin($request), 'brand', 'deleted', $brand);

        return ApiResponse::ok(null, 'Merek dihapus.');
    }
}
