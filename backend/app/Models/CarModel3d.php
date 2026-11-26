<?php

namespace App\Models;

use Database\Factories\CarModel3dFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The glTF model of a car (one per car).
 *
 * @property int $id
 * @property int $car_id
 * @property string $file_path
 * @property int $file_size
 * @property string|null $poster_path
 * @property array<string, mixed> $camera
 * @property string $source_name
 * @property string|null $source_url
 * @property string $license
 * @property bool $is_illustrative
 * @property int $model_version
 */
class CarModel3d extends Model
{
    /** @use HasFactory<CarModel3dFactory> */
    use HasFactory;

    protected $table = 'car_models_3d';

    protected $fillable = [
        'car_id', 'file_path', 'file_size', 'poster_path', 'camera', 'source_name', 'source_url',
        'license', 'is_illustrative', 'model_version',
    ];

    protected $attributes = ['camera' => '{}', 'model_version' => 1];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'camera' => 'array',
            'is_illustrative' => 'boolean',
            'model_version' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }
}
