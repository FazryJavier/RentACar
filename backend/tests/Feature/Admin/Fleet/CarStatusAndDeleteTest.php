<?php

use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Models\Booking;
use App\Models\Car;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\AdminBrowsers;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->car = Car::factory()->create();
    $this->browser = AdminBrowsers::superAdmin($this, $this->admin);
});

function bookingFor(Car $car, BookingStatus $status, CarbonImmutable $pickup, array $extra = []): Booking
{
    return Booking::factory()->forCar($car, $pickup)->status($status)->create($extra);
}

function setStatus($test, string $status, array $extra = [])
{
    return $test->browser->json('PATCH', "/api/v1/admin/cars/{$test->car->id}", ['status' => $status, 'version' => $test->car->fresh()->version, ...$extra]);
}

it('blocks maintenance while an upcoming booking holds the schedule', function () {
    $pickup = CarbonImmutable::parse('2030-01-10 02:00:00', 'UTC');
    $booking = bookingFor($this->car, BookingStatus::Confirmed, $pickup);

    setStatus($this, 'maintenance')
        ->assertStatus(409)
        ->assertJsonPath('errors.0.code', 'car_has_active_bookings')
        ->assertJsonPath('errors.0.details.bookings.0.code', $booking->code)
        ->assertJsonPath('errors.0.details.bookings.0.status', 'confirmed')
        ->assertJsonPath('errors.0.details.bookings.0.pickup_at', '2030-01-10T02:00:00Z');

    expect($this->car->fresh()->status)->toBe(CarStatus::Active)->and($booking->fresh()->status)->toBe(BookingStatus::Confirmed);
});

it('blocks inactive for pending verification and unexpired pending payment', function (BookingStatus $status) {
    bookingFor($this->car, $status, now()->toImmutable()->addDays(3));

    setStatus($this, 'inactive')->assertStatus(409);
})->with([BookingStatus::PendingVerification, BookingStatus::PendingPayment]);

it('force-cancels the bookings with a reason, history and audit', function () {
    $first = bookingFor($this->car, BookingStatus::Confirmed, now()->toImmutable()->addDays(3));
    $second = bookingFor($this->car, BookingStatus::PendingVerification, now()->toImmutable()->addDays(10));

    setStatus($this, 'maintenance', ['force_cancel_bookings' => true, 'cancel_reason' => 'Mobil masuk bengkel'])
        ->assertOk()->assertJsonPath('data.status', 'maintenance');

    foreach ([$first, $second] as $booking) {
        $fresh = $booking->fresh();
        expect($fresh->status)->toBe(BookingStatus::Cancelled)->and($fresh->status_reason)->toBe('Mobil masuk bengkel');
        $history = DB::table('booking_status_histories')->where('booking_id', $booking->id)->first();
        expect($history->to_status)->toBe('cancelled')->and($history->actor_type)->toBe('admin')
            ->and($history->actor_id)->toBe($this->admin->id)->and($history->reason)->toBe('Mobil masuk bengkel');
    }
    expect(DB::table('audit_logs')->where('action', 'admin.booking.cancelled')->count())->toBe(2)
        ->and(DB::table('audit_logs')->where('action', 'admin.car.updated')->count())->toBe(1);
});

it('requires a cancel reason of 5–300 characters when forcing', function (?string $reason) {
    bookingFor($this->car, BookingStatus::Confirmed, now()->toImmutable()->addDays(3));

    setStatus($this, 'maintenance', ['force_cancel_bookings' => true, 'cancel_reason' => $reason])
        ->assertUnprocessable()->assertJsonPath('errors.0.field', 'cancel_reason');
})->with([null, 'abcd', str_repeat('a', 301)]);

it('never cancels an ongoing rental', function () {
    $ongoing = bookingFor($this->car, BookingStatus::Ongoing, now()->toImmutable()->subDay());

    setStatus($this, 'maintenance', ['force_cancel_bookings' => true, 'cancel_reason' => 'Mobil masuk bengkel'])
        ->assertStatus(409)
        ->assertJsonPath('errors.0.message', 'Mobil sedang disewa sehingga statusnya belum bisa diubah.');

    expect($ongoing->fresh()->status)->toBe(BookingStatus::Ongoing)->and($this->car->fresh()->status)->toBe(CarStatus::Active);
});

it('ignores finished bookings and expired pending payments', function () {
    bookingFor($this->car, BookingStatus::Completed, now()->toImmutable()->addDays(3));
    bookingFor($this->car, BookingStatus::PendingPayment, now()->toImmutable()->addDays(8), ['payment_deadline' => now()->subMinute()]);
    bookingFor($this->car, BookingStatus::Confirmed, now()->toImmutable()->subDays(10));

    setStatus($this, 'maintenance')->assertOk()->assertJsonPath('data.status', 'maintenance');
});

it('soft-deletes a car without holding bookings, keeping it linked from old bookings', function () {
    $old = bookingFor($this->car, BookingStatus::Completed, now()->toImmutable()->subDays(20));

    $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}")->assertOk();

    expect(Car::query()->find($this->car->id))->toBeNull()
        ->and(Car::withTrashed()->find($this->car->id)->deleted_at)->not->toBeNull()
        ->and($old->fresh()->car()->withTrashed()->first()?->id)->toBe($this->car->id);
    $this->browser->get('/api/v1/admin/cars')->assertJsonPath('meta.total', 0);
    expect(DB::table('audit_logs')->where('action', 'admin.car.deleted')->count())->toBe(1);
});

it('refuses to delete a car with a holding booking', function () {
    bookingFor($this->car, BookingStatus::PendingVerification, now()->toImmutable()->addDays(2));

    $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}")
        ->assertStatus(409)->assertJsonPath('errors.0.code', 'car_has_active_bookings');
    expect($this->car->fresh()->deleted_at)->toBeNull();
});
