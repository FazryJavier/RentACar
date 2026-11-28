<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Catalog\PublicSettings;
use App\Domain\Catalog\PublicStats;
use App\Enums\CarStatus;
use App\Http\Controllers\Controller;
use App\Models\CarModel3d;
use App\Models\Testimonial;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/** Public website content: testimonials, statistics, public settings and model credits (no internal IDs). */
final class PublicContentController extends Controller
{
    use PublicCache;

    private const TESTIMONIAL_LIMIT = 6;

    /**
     * Published testimonials, newest first (at most 6). Items with `is_demo` must be labelled
     * as demo content by the client.
     */
    public function testimonials(): JsonResponse
    {
        $disk = Storage::disk('public');
        $items = Testimonial::query()
            ->where('is_published', true)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(self::TESTIMONIAL_LIMIT)
            ->get()
            ->map(fn (Testimonial $testimonial): array => [
                'name' => $testimonial->name,
                'city' => $testimonial->city,
                'quote' => $testimonial->quote,
                'rating' => $testimonial->rating,
                'avatar_url' => $testimonial->avatar_path !== null ? $disk->url($testimonial->avatar_path) : null,
                'is_demo' => $testimonial->is_demo,
            ])->all();

        return $this->cacheable(ApiResponse::ok($items));
    }

    /** Counts of active cars, active branches, categories and completed bookings. */
    public function stats(PublicStats $stats): JsonResponse
    {
        return $this->cacheable(ApiResponse::ok($stats->counts()));
    }

    /** Allowlisted public settings: booking limits, GPS retention and the terms text. */
    public function settings(PublicSettings $settings): JsonResponse
    {
        return $this->cacheable(ApiResponse::ok($settings->values()));
    }

    /** Source and licence of every 3D model on an active car, by car name. */
    public function credits(): JsonResponse
    {
        $items = CarModel3d::query()
            ->select('car_models_3d.*')
            ->join('cars', 'cars.id', '=', 'car_models_3d.car_id')
            ->join('brands', 'brands.id', '=', 'cars.brand_id')
            ->where('cars.status', CarStatus::Active->value)
            ->whereNull('cars.deleted_at')
            ->orderBy('brands.name')
            ->orderBy('cars.model_name')
            ->orderBy('cars.year')
            ->orderBy('cars.id')
            ->with('car.brand')
            ->get()
            ->map(fn (CarModel3d $model): array => [
                'car' => [
                    'slug' => $model->car->slug,
                    'name' => "{$model->car->brand->name} {$model->car->model_name} {$model->car->year}",
                ],
                'source_name' => $model->source_name,
                'source_url' => $model->source_url,
                'license' => $model->license,
                'is_illustrative' => $model->is_illustrative,
            ])->all();

        return $this->cacheable(ApiResponse::ok($items));
    }
}
