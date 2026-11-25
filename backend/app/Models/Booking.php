<?php

namespace App\Models;

use App\Enums\BookingStatus;
use App\Models\Concerns\BranchScoped;
use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A rental booking with snapshots of price and renter data taken at creation time.
 * Business rules (availability, pricing, status transitions) live in app/Domain.
 */
class Booking extends Model
{
    use BranchScoped;

    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    protected $fillable = [
        'code', 'customer_id', 'car_id', 'branch_id', 'created_by_admin_id', 'pickup_at', 'return_at',
        'blocked_until', 'status', 'payment_deadline', 'payment_attempts', 'rental_days', 'daily_price',
        'deposit', 'rental_subtotal', 'total_amount', 'renter_name', 'renter_phone', 'renter_license_number',
        'notes', 'terms_accepted_at', 'actual_pickup_at', 'actual_return_at', 'odometer_start',
        'odometer_end', 'return_condition_notes', 'status_reason',
    ];

    protected $attributes = ['version' => 1, 'payment_attempts' => 0];

    protected function casts(): array
    {
        return [
            'status' => BookingStatus::class,
            'pickup_at' => 'immutable_datetime',
            'return_at' => 'immutable_datetime',
            'blocked_until' => 'immutable_datetime',
            'payment_deadline' => 'immutable_datetime',
            'terms_accepted_at' => 'immutable_datetime',
            'actual_pickup_at' => 'immutable_datetime',
            'actual_return_at' => 'immutable_datetime',
            'payment_attempts' => 'integer',
            'rental_days' => 'integer',
            'daily_price' => 'integer',
            'deposit' => 'integer',
            'rental_subtotal' => 'integer',
            'total_amount' => 'integer',
            'odometer_start' => 'integer',
            'odometer_end' => 'integer',
            'version' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** @return BelongsTo<Car, $this> */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** @return BelongsTo<Admin, $this> */
    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'created_by_admin_id');
    }

    /** @return HasMany<BookingStatusHistory, $this> */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(BookingStatusHistory::class)->orderBy('created_at');
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('attempt_no');
    }
}
