<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Domain\Catalog\PublicStats;
use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/** Public website content: testimonials and aggregate statistics (no internal IDs). */
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
}
