<?php

use App\Enums\BookingStatus;
use App\Models\Admin;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarPhoto;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Testimonial;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';
/** ON DELETE RESTRICT raises restrict_violation (23001), not foreign_key_violation (23503). */
const RESTRICT_VIOLATION = '23001';
const EXCLUSION_VIOLATION = '23P01';

/**
 * Runs $statement inside a savepoint and asserts it fails with the given SQLSTATE.
 */
function expectSqlState(string $sqlState, callable $statement): void
{
    try {
        DB::transaction(fn () => $statement());
    } catch (QueryException $e) {
        expect($e->getCode())->toBe($sqlState);

        return;
    }

    test()->fail("Expected SQLSTATE {$sqlState}, but the statement succeeded.");
}

/**
 * Raw booking row for $car covering [$start, $end) with the given status (amounts kept consistent).
 *
 * @return array<string, mixed>
 */
function bookingRow(Car $car, Customer $customer, string $start, string $end, BookingStatus $status = BookingStatus::Confirmed, array $overrides = []): array
{
    return array_merge([
        'code' => 'RAC-'.strtoupper(bin2hex(random_bytes(4))),
        'customer_id' => $customer->id,
        'car_id' => $car->id,
        'branch_id' => $car->branch_id,
        'pickup_at' => $start,
        'return_at' => $end,
        'blocked_until' => $end,
        'status' => $status->value,
        'payment_deadline' => $status === BookingStatus::PendingPayment ? CarbonImmutable::parse($start)->subDay() : null,
        'rental_days' => 1,
        'daily_price' => 350_000,
        'deposit' => 500_000,
        'rental_subtotal' => 350_000,
        'total_amount' => 850_000,
        'renter_name' => 'Penyewa Uji',
        'renter_phone' => '6281200000000',
        'renter_license_number' => '123456789012',
        'terms_accepted_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ], $overrides);
}

describe('bookings_no_overlap', function () {
    beforeEach(function () {
        $this->car = Car::factory()->create();
        $this->customer = Customer::factory()->create();
        DB::table('bookings')->insert(bookingRow($this->car, $this->customer, '2026-12-01 10:00:00+00', '2026-12-01 14:00:00+00'));
    });

    it('rejects an overlapping active booking for the same car', function () {
        expectSqlState(EXCLUSION_VIOLATION, fn () => DB::table('bookings')->insert(
            bookingRow($this->car, $this->customer, '2026-12-01 13:00:00+00', '2026-12-01 18:00:00+00'),
        ));
    });

    it('allows a booking that starts exactly when the blocked range ends', function () {
        DB::table('bookings')->insert(bookingRow($this->car, $this->customer, '2026-12-01 14:00:00+00', '2026-12-01 18:00:00+00'));

        expect(DB::table('bookings')->where('car_id', $this->car->id)->count())->toBe(2);
    });

    it('ignores bookings whose status does not hold the schedule', function (BookingStatus $status) {
        DB::table('bookings')->where('car_id', $this->car->id)->update(['status' => $status->value, 'payment_deadline' => null]);

        DB::table('bookings')->insert(bookingRow($this->car, $this->customer, '2026-12-01 11:00:00+00', '2026-12-01 12:00:00+00'));

        expect(DB::table('bookings')->where('car_id', $this->car->id)->count())->toBe(2);
    })->with([BookingStatus::Cancelled, BookingStatus::Rejected, BookingStatus::Expired, BookingStatus::Completed]);

    it('blocks every schedule-holding status', function (BookingStatus $status) {
        expectSqlState(EXCLUSION_VIOLATION, fn () => DB::table('bookings')->insert(
            bookingRow($this->car, $this->customer, '2026-12-01 12:00:00+00', '2026-12-01 13:00:00+00', $status),
        ));
    })->with([BookingStatus::PendingPayment, BookingStatus::PendingVerification, BookingStatus::Confirmed, BookingStatus::Ongoing]);

    it('does not conflict across different cars', function () {
        $otherCar = Car::factory()->create();

        DB::table('bookings')->insert(bookingRow($otherCar, $this->customer, '2026-12-01 10:00:00+00', '2026-12-01 14:00:00+00'));

        expect(DB::table('bookings')->count())->toBe(2);
    });
});

describe('uniqueness', function () {
    it('allows reusing a plate number only after the old car is soft-deleted', function () {
        $car = Car::factory()->create(['plate_number' => 'B 1234 XYZ']);

        expectSqlState(UNIQUE_VIOLATION, fn () => Car::factory()->create(['plate_number' => 'B 1234 XYZ']));

        $car->delete();
        Car::factory()->create(['plate_number' => 'B 1234 XYZ']);

        expect(Car::withTrashed()->where('plate_number', 'B 1234 XYZ')->count())->toBe(2);
    });

    it('treats customer and admin emails case-insensitively', function () {
        Customer::factory()->create(['email' => 'Budi@Example.test']);
        expectSqlState(UNIQUE_VIOLATION, fn () => Customer::factory()->create(['email' => 'budi@example.test']));

        Admin::factory()->superAdmin()->create(['email' => 'Admin@Example.test']);
        expectSqlState(UNIQUE_VIOLATION, fn () => Admin::factory()->superAdmin()->create(['email' => 'admin@EXAMPLE.test']));
    });

    it('treats brand names case-insensitively', function () {
        Brand::factory()->create(['name' => 'Toyota', 'slug' => 'toyota']);

        expectSqlState(UNIQUE_VIOLATION, fn () => Brand::factory()->create(['name' => 'TOYOTA', 'slug' => 'toyota-2']));
    });

    it('allows only one pending payment per booking', function () {
        $booking = Booking::factory()->status(BookingStatus::PendingVerification)->create();
        Payment::factory()->create(['booking_id' => $booking->id, 'attempt_no' => 1]);

        expectSqlState(UNIQUE_VIOLATION, fn () => Payment::factory()->create(['booking_id' => $booking->id, 'attempt_no' => 2]));

        Payment::factory()->rejected()->create(['booking_id' => $booking->id, 'attempt_no' => 2]);
        expect($booking->payments()->count())->toBe(2);
    });

    it('rejects a repeated payment attempt number', function () {
        $booking = Booking::factory()->create();
        Payment::factory()->rejected()->create(['booking_id' => $booking->id, 'attempt_no' => 1]);

        expectSqlState(UNIQUE_VIOLATION, fn () => Payment::factory()->rejected()->create(['booking_id' => $booking->id, 'attempt_no' => 1]));
    });
});

describe('check constraints', function () {
    it('requires staff to have a branch and super admins to have none', function () {
        expectSqlState(CHECK_VIOLATION, fn () => Admin::factory()->create(['role' => 'staff', 'branch_id' => null]));
        expectSqlState(CHECK_VIOLATION, fn () => Admin::factory()->create(['role' => 'super_admin', 'branch_id' => Branch::factory()->create()->id]));
    });

    it('rejects inconsistent booking totals, unknown statuses and reversed times', function () {
        $car = Car::factory()->create();
        $customer = Customer::factory()->create();

        expectSqlState(CHECK_VIOLATION, fn () => DB::table('bookings')->insert(bookingRow($car, $customer, '2026-12-05 10:00:00+00', '2026-12-07 10:00:00+00', overrides: [
            'rental_days' => 2, 'daily_price' => 350_000, 'rental_subtotal' => 600_000, 'total_amount' => 1_100_000,
        ])));
        expectSqlState(CHECK_VIOLATION, fn () => DB::table('bookings')->insert(bookingRow($car, $customer, '2026-12-05 10:00:00+00', '2026-12-06 10:00:00+00', overrides: ['status' => 'paid'])));
        expectSqlState(CHECK_VIOLATION, fn () => DB::table('bookings')->insert(bookingRow($car, $customer, '2026-12-06 10:00:00+00', '2026-12-06 10:00:00+00')));
        expectSqlState(CHECK_VIOLATION, fn () => DB::table('bookings')->insert(bookingRow($car, $customer, '2026-12-05 10:00:00+00', '2026-12-06 10:00:00+00', BookingStatus::PendingPayment, ['payment_deadline' => null])));
    });

    it('rejects car values outside their ranges', function (array $attributes) {
        expectSqlState(CHECK_VIOLATION, fn () => Car::factory()->create($attributes));
    })->with([
        'year' => [['year' => 1999]],
        'seats' => [['seats' => 17]],
        'price too low' => [['daily_price' => 99_999]],
        'price too high' => [['daily_price' => 10_000_001]],
    ]);

    it('rejects an unknown car status written directly to the database', function () {
        $car = Car::factory()->create();

        // Eloquent's enum cast would refuse 'sold' in PHP already; prove the database refuses it too.
        expectSqlState(CHECK_VIOLATION, fn () => DB::table('cars')->where('id', $car->id)->update(['status' => 'sold']));
    });

    it('requires a reason for rejected payments', function () {
        expectSqlState(CHECK_VIOLATION, fn () => Payment::factory()->create(['status' => 'rejected', 'reject_reason' => null]));
    });

    it('rejects branch hours that end before they start', function () {
        expectSqlState(CHECK_VIOLATION, fn () => Branch::factory()->create(['opening_time' => '21:00', 'closing_time' => '07:00']));
    });

    it('requires position and model version together on condition markers', function () {
        expectSqlState(CHECK_VIOLATION, fn () => CarCondition::factory()->create(['position' => [0, 1, 0], 'model_version' => null]));
    });

    it('keeps testimonial ratings between 1 and 5', function () {
        expectSqlState(CHECK_VIOLATION, fn () => Testimonial::factory()->create(['rating' => 6]));
    });
});

describe('referential actions', function () {
    it('prevents deleting a branch that is still used by a car', function () {
        $car = Car::factory()->create();

        expectSqlState(RESTRICT_VIOLATION, fn () => DB::table('branches')->where('id', $car->branch_id)->delete());
    });

    it('deletes car photos together with a hard-deleted car', function () {
        $photo = CarPhoto::factory()->create();

        $photo->car->forceDelete();

        expect(CarPhoto::query()->whereKey($photo->id)->exists())->toBeFalse();
    });
});
