<?php

use App\Enums\BookingStatus;

it('marks exactly the schedule-holding statuses', function () {
    $holding = array_values(array_filter(BookingStatus::cases(), fn (BookingStatus $s) => $s->holdsSchedule()));

    expect($holding)->toBe([
        BookingStatus::PendingPayment,
        BookingStatus::PendingVerification,
        BookingStatus::Confirmed,
        BookingStatus::Ongoing,
    ]);
});

it('marks exactly the final statuses', function () {
    $final = array_values(array_filter(BookingStatus::cases(), fn (BookingStatus $s) => $s->isFinal()));

    expect($final)->toBe([
        BookingStatus::Completed,
        BookingStatus::Cancelled,
        BookingStatus::Rejected,
        BookingStatus::Expired,
    ]);
});

it('lists values in declaration order', function () {
    expect(BookingStatus::values())->toBe([
        'pending_payment', 'pending_verification', 'confirmed', 'ongoing',
        'completed', 'cancelled', 'rejected', 'expired',
    ])->and(BookingStatus::holdingSqlList())->toBe("'pending_payment', 'pending_verification', 'confirmed', 'ongoing'");
});
