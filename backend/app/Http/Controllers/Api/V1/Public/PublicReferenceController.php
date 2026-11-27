<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/** Public reference lists for search forms and filters (no internal IDs). */
final class PublicReferenceController extends Controller
{
    use PublicCache;

    public function branches(): JsonResponse
    {
        $branches = Branch::query()->where('is_active', true)->orderBy('name')->get()
            ->map(fn (Branch $branch): array => [
                'slug' => $branch->slug,
                'name' => $branch->name,
                'address' => $branch->address,
                'city' => $branch->city,
                'phone' => $branch->phone,
                'opening_time' => substr((string) $branch->opening_time, 0, 5),
                'closing_time' => substr((string) $branch->closing_time, 0, 5),
                'latitude' => (string) $branch->latitude,
                'longitude' => (string) $branch->longitude,
            ])->all();

        return $this->cacheable(ApiResponse::ok($branches));
    }

    public function categories(): JsonResponse
    {
        $categories = Category::query()->orderBy('sort_order')->orderBy('name')->get()
            ->map(fn (Category $category): array => [
                'slug' => $category->slug,
                'name' => $category->name,
                'description' => $category->description,
            ])->all();

        return $this->cacheable(ApiResponse::ok($categories));
    }

    public function brands(): JsonResponse
    {
        $disk = Storage::disk('public');
        $brands = Brand::query()->orderBy('name')->get()
            ->map(fn (Brand $brand): array => [
                'slug' => $brand->slug,
                'name' => $brand->name,
                'logo_url' => $brand->logo_path !== null ? $disk->url($brand->logo_path) : null,
            ])->all();

        return $this->cacheable(ApiResponse::ok($brands));
    }
}
