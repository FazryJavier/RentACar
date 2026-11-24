<?php

namespace App\Models;

use Database\Factories\CarInspectionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CarInspection extends Model
{
    /** @use HasFactory<CarInspectionFactory> */
    use HasFactory;

    protected $fillable = ['car_id', 'booking_id', 'admin_id', 'inspected_at', 'odometer_km', 'notes'];

    protected function casts(): array
    {
        return [
            'inspected_at' => 'immutable_datetime',
            'odometer_km' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /** @return BelongsTo<Admin, $this> */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}
