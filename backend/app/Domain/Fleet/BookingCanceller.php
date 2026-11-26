<?php

namespace App\Domain\Fleet;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Enums\ActorType;
use App\Enums\BookingStatus;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\BookingStatusHistory;
use Illuminate\Http\Request;

/**
 * Cancels a booking on behalf of an admin: status, reason, status history and audit.
 * Call inside the caller's transaction with the booking row locked.
 */
final class BookingCanceller
{
    public function __construct(private readonly MasterDataAudit $audit) {}

    public function cancelByAdmin(Request $request, Booking $booking, Admin $admin, string $reason): void
    {
        $from = $booking->status;

        $booking->forceFill([
            'status' => BookingStatus::Cancelled,
            'status_reason' => $reason,
            // The row is locked by the caller, so a plain increment is safe.
            'version' => $booking->version + 1,
        ])->save();

        BookingStatusHistory::query()->create([
            'booking_id' => $booking->id,
            'from_status' => $from,
            'to_status' => BookingStatus::Cancelled,
            'actor_type' => ActorType::Admin,
            'actor_id' => $admin->id,
            'reason' => $reason,
        ]);

        $this->audit->record($request, $admin, 'booking', 'cancelled', $booking, [
            'status' => [$from->value, BookingStatus::Cancelled->value],
            'status_reason' => [null, $reason],
        ]);
    }
}
