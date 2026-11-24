<?php

namespace App\Models;

use Database\Factories\CarConditionPhotoFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarConditionPhoto extends Model
{
    /** @use HasFactory<CarConditionPhotoFactory> */
    use HasFactory;

    protected $fillable = ['car_condition_id', 'path', 'sort_order'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer', 'created_at' => 'immutable_datetime', 'updated_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<CarCondition, $this> */
    public function condition(): BelongsTo
    {
        return $this->belongsTo(CarCondition::class, 'car_condition_id');
    }
}
