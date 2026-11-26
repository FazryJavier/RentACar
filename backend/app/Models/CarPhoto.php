<?php

namespace App\Models;

use Database\Factories\CarPhotoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarPhoto extends Model
{
    /** @use HasFactory<CarPhotoFactory> */
    use HasFactory;

    protected $fillable = ['car_id', 'path', 'variants', 'alt_text', 'sort_order', 'processed_at'];

    protected $attributes = ['variants' => '{}'];

    protected function casts(): array
    {
        return [
            'variants' => 'array',
            'sort_order' => 'integer',
            'processed_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    public function isProcessed(): bool
    {
        return $this->processed_at !== null;
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
