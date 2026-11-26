<?php

namespace App\Http\Controllers\Api\V1\Admin\MasterData;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Domain\Admin\MasterData\Slugger;
use App\Domain\Admin\MasterData\UsageGuard;
use App\Domain\Admin\MasterData\VersionedUpdate;
use App\Http\Requests\Admin\MasterData\BranchRequest;
use App\Http\Resources\BranchResource;
use App\Models\Branch;
use App\Support\ApiResponse;
use App\Support\Query\CollectionQuery;
use App\Support\Query\QuerySpec;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Branches: both roles may read; only Super Admin may write (route middleware).
 */
final class BranchController extends AdminController
{
    private const FIELDS = ['name', 'address', 'city', 'phone', 'opening_time', 'closing_time', 'latitude', 'longitude', 'is_active'];

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
            sorts: ['name' => 'name', 'city' => 'city', 'created_at' => 'created_at'],
            defaultSort: 'name',
            searchColumns: ['name', 'city'],
            filters: [
                'is_active' => function (Builder $query, mixed $value): void {
                    $flag = filter_var(is_array($value) ? reset($value) : $value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
                    if ($flag !== null) {
                        $query->where('is_active', $flag);
                    }
                },
                'city' => function (Builder $query, mixed $value): void {
                    if (is_string($value) && $value !== '') {
                        $query->whereRaw('lower(city) = lower(?)', [$value]);
                    }
                },
            ],
        );

        $page = CollectionQuery::fromRequest($request, $spec)->paginate(Branch::query());

        return ApiResponse::paginated($page, BranchResource::collection($page->items())->resolve($request));
    }

    public function show(Request $request, Branch $branch): JsonResponse
    {
        return ApiResponse::ok(BranchResource::make($branch)->resolve($request));
    }

    public function store(BranchRequest $request): JsonResponse
    {
        $data = $request->safe()->only(self::FIELDS);

        $branch = DB::transaction(fn () => Branch::query()->create([
            ...$data,
            'slug' => $this->slugger->unique(Branch::class, (string) $data['name']),
        ]));

        $this->audit->record($request, $this->admin($request), 'branch', 'created', $branch);

        return ApiResponse::created(BranchResource::make($branch->refresh())->resolve($request), 'Cabang disimpan.');
    }

    public function update(BranchRequest $request, Branch $branch): JsonResponse
    {
        $values = $request->safe()->only(self::FIELDS);
        if (isset($values['name']) && $values['name'] !== $branch->name) {
            $values['slug'] = $this->slugger->unique(Branch::class, (string) $values['name'], $branch->id);
        }

        [$branch, $changes] = $this->versioned->apply($branch, $values, $request->integer('version'));

        if ($changes !== []) {
            $this->audit->record($request, $this->admin($request), 'branch', 'updated', $branch, $changes);
        }

        return ApiResponse::ok(BranchResource::make($branch)->resolve($request), 'Cabang disimpan.');
    }

    public function destroy(Request $request, Branch $branch): JsonResponse
    {
        $this->usage->deleteUnlessUsed($branch, 'Cabang', [
            'cars' => ['label' => 'mobil', 'count' => fn (): int => $branch->cars()->withTrashed()->count()],
            'admins' => ['label' => 'admin', 'count' => fn (): int => $branch->admins()->withTrashed()->count()],
            'bookings' => ['label' => 'pemesanan', 'count' => fn (): int => $branch->bookings()->count()],
        ]);

        $this->audit->record($request, $this->admin($request), 'branch', 'deleted', $branch);

        return ApiResponse::ok(null, 'Cabang dihapus.');
    }
}
