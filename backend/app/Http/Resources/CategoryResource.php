<?php

namespace App\Http\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property-read Category $resource */
class CategoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $category = $this->resource;

        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'sort_order' => $category->sort_order,
            'version' => $category->version,
            'created_at' => $category->created_at?->utc()->toIso8601ZuluString(),
            'updated_at' => $category->updated_at?->utc()->toIso8601ZuluString(),
        ];
    }
}
