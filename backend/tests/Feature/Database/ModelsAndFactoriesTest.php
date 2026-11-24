<?php

use App\Enums\BookingStatus;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingStatusHistory;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarConditionPhoto;
use App\Models\CarInspection;
use App\Models\CarModel3d;
use App\Models\CarPhoto;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Event;
use App\Models\IdempotencyKey;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Testimonial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('creates a valid row with every factory', function (string $model) {
    $instance = $model::factory()->create();

    expect($instance->exists)->toBeTrue();
})->with([
    Branch::class, Brand::class, Category::class, Admin::class, Customer::class, Car::class, CarPhoto::class,
    CarModel3d::class, CarCondition::class, CarConditionPhoto::class, CarInspection::class, Booking::class,
    BookingStatusHistory::class, Payment::class, IdempotencyKey::class, Setting::class, AuditLog::class,
    Event::class, Testimonial::class,
]);

it('supports the common factory states', function () {
    expect(Admin::factory()->superAdmin()->create()->branch_id)->toBeNull()
        ->and(Admin::factory()->staff()->create()->branch_id)->not->toBeNull()
        ->and(Car::factory()->inMaintenance()->create()->status->value)->toBe('maintenance')
        ->and(CarCondition::factory()->onModel()->create()->model_version)->toBe(1)
        ->and(CarCondition::factory()->resolved()->create()->is_resolved)->toBeTrue()
        ->and(Booking::factory()->status(BookingStatus::PendingPayment)->create()->payment_deadline)->not->toBeNull();
});

it('creates many default bookings without tripping the overlap constraint', function () {
    Booking::factory()->count(20)->create();

    expect(Booking::query()->count())->toBe(20);
});

it('keeps booking amounts and buffer consistent', function () {
    $booking = Booking::factory()->create();

    expect($booking->rental_subtotal)->toBe($booking->rental_days * $booking->daily_price)
        ->and($booking->total_amount)->toBe($booking->rental_subtotal + $booking->deposit)
        ->and($booking->blocked_until->diffInMinutes($booking->return_at, absolute: true))->toBe(120.0)
        ->and($booking->branch_id)->toBe($booking->car->branch_id);
});

it('places bookings deliberately with forCar()', function () {
    $car = Car::factory()->create();
    $start = now('UTC')->toImmutable()->addDays(3)->setTime(2, 0);

    Booking::factory()->forCar($car, $start, 2)->create();
    Booking::factory()->forCar($car, $start->addDays(5), 1)->create();

    expect($car->bookings()->count())->toBe(2);
});

it('uses fictional example.test emails', function () {
    $emails = Customer::factory()->count(10)->create()->pluck('email');

    expect($emails->every(fn (string $email) => str_ends_with($email, '@example.test')))->toBeTrue();
});

it('resolves relations', function () {
    $booking = Booking::factory()->create();
    BookingStatusHistory::factory()->create(['booking_id' => $booking->id]);

    $loaded = Booking::query()->with(['car.brand', 'car.category', 'car.branch', 'customer', 'statusHistories'])->findOrFail($booking->id);

    expect($loaded->car->brand)->toBeInstanceOf(Brand::class)
        ->and($loaded->car->category)->toBeInstanceOf(Category::class)
        ->and($loaded->customer)->toBeInstanceOf(Customer::class)
        ->and($loaded->statusHistories)->toHaveCount(1);
});

it('round-trips enum casts', function () {
    $booking = Booking::factory()->status(BookingStatus::Confirmed)->create();

    expect($booking->fresh()->status)->toBe(BookingStatus::Confirmed)
        ->and(DB::table('bookings')->where('id', $booking->id)->value('status'))->toBe('confirmed');
});

it('hashes and hides passwords', function () {
    $customer = Customer::factory()->create(['password' => 'Secret123']);

    expect(DB::table('customers')->where('id', $customer->id)->value('password'))->not->toBe('Secret123')
        ->and(Hash::check('Secret123', $customer->password))->toBeTrue()
        ->and($customer->toArray())->not->toHaveKeys(['password', 'remember_token']);
});

it('soft deletes cars, customers and admins', function (string $model) {
    $instance = $model::factory()->create();
    $instance->delete();

    expect($model::query()->whereKey($instance->id)->exists())->toBeFalse()
        ->and($model::withTrashed()->whereKey($instance->id)->first()?->deleted_at)->not->toBeNull();
})->with([Car::class, Customer::class, Admin::class]);
