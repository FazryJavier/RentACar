<?php

namespace App\Models;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Concerns\BranchScoped;
use Database\Factories\CarFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $slug
 * @property int $brand_id
 * @property int $category_id
 * @property int $branch_id
 * @property string $model_name
 * @property int $year
 * @property string $plate_number
 * @property string $color
 * @property Transmission $transmission
 * @property FuelType $fuel_type
 * @property int $seats
 * @property int|null $luggage_capacity
 * @property string|null $description
 * @property list<string> $features
 * @property CarStatus $status
 * @property int $daily_price
 * @property int $deposit
 * @property int $version
 */
class Car extends Model
{
    use BranchScoped;

    /** @use HasFactory<CarFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'slug', 'brand_id', 'category_id', 'branch_id', 'model_name', 'year', 'plate_number', 'color',
        'transmission', 'fuel_type', 'seats', 'luggage_capacity', 'daily_price', 'deposit', 'description',
        'features', 'status', 'odometer_km', 'last_inspected_at', 'completed_bookings_count',
    ];

    protected $attributes = ['version' => 1, 'features' => '[]'];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'seats' => 'integer',
            'luggage_capacity' => 'integer',
            'daily_price' => 'integer',
            'deposit' => 'integer',
            'odometer_km' => 'integer',
            'completed_bookings_count' => 'integer',
            'features' => 'array',
            'transmission' => Transmission::class,
            'fuel_type' => FuelType::class,
            'status' => CarStatus::class,
            'last_inspected_at' => 'immutable_datetime',
            'version' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
            'deleted_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return HasMany<CarPhoto, $this> */
    public function photos(): HasMany
    {
        return $this->hasMany(CarPhoto::class)->orderBy('sort_order');
    }

    /** @return HasOne<CarModel3d, $this> */
    public function model3d(): HasOne
    {
        return $this->hasOne(CarModel3d::class);
    }

    /** @return HasMany<CarCondition, $this> */
    public function conditions(): HasMany
    {
        return $this->hasMany(CarCondition::class);
    }

    /** @return HasMany<CarInspection, $this> */
    public function inspections(): HasMany
    {
        return $this->hasMany(CarInspection::class);
    }

    /** @return HasMany<Booking, $this> */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
