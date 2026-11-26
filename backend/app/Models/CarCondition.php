<?php

namespace App\Models;

use App\Enums\ConditionArea;
use App\Enums\ConditionSeverity;
use Carbon\CarbonImmutable;
use Database\Factories\CarConditionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A condition marker (hotspot) on a car, e.g. a scratch on the left door.
 *
 * @property int $id
 * @property int $car_id
 * @property ConditionArea $area
 * @property ConditionSeverity $severity
 * @property string $description
 * @property list<float>|null $position
 * @property list<float>|null $normal
 * @property int|null $model_version
 * @property CarbonImmutable $inspected_on
 * @property bool $is_resolved
 * @property CarbonImmutable|null $resolved_at
 * @property CarbonImmutable|null $created_at
 */
class CarCondition extends Model
{
    /** @use HasFactory<CarConditionFactory> */
    use HasFactory;

    protected $fillable = [
        'car_id', 'area', 'severity', 'description', 'position', 'normal', 'model_version',
        'inspected_on', 'is_resolved', 'resolved_at', 'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'area' => ConditionArea::class,
            'severity' => ConditionSeverity::class,
            'position' => 'array',
            'normal' => 'array',
            'model_version' => 'integer',
            'inspected_on' => 'immutable_date',
            'is_resolved' => 'boolean',
            'resolved_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /** @return BelongsTo<Admin, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /** @return HasMany<CarConditionPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(CarConditionPhoto::class)->orderBy('sort_order');
    }
}
