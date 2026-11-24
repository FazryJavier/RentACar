<?php

namespace App\Models;

use App\Enums\ActorType;
use App\Enums\BookingStatus;
use Database\Factories\BookingStatusHistoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Append-only record of booking status changes.
 */
class BookingStatusHistory extends Model
{
    /** @use HasFactory<BookingStatusHistoryFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    protected $fillable = ['booking_id', 'from_status', 'to_status', 'actor_type', 'actor_id', 'reason'];

    protected function casts(): array
    {
        return [
            'from_status' => BookingStatus::class,
            'to_status' => BookingStatus::class,
            'actor_type' => ActorType::class,
            'created_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Booking, $this> */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
