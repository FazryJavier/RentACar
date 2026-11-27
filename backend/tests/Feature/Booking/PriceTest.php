<?php

use App\Domain\Booking\PriceCalculator;
use App\Domain\Booking\PriceToken;
use App\Domain\Booking\RentalWindow;
use App\Models\Branch;
use App\Models\Car;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('follows the FRD examples', function (int $minutes, int $days, int $total) {
    $price = PriceCalculator::compute(350000, 500000, $minutes);

    expect($price->rentalDays)->toBe($days)
        ->and($price->rentalSubtotal)->toBe($days * 350000)
        ->and($price->totalAmount)->toBe($total);
})->with([
    '24 h' => [24 * 60, 1, 850000],
    '25 h' => [25 * 60, 2, 1200000],
    '95.5 h' => [95 * 60 + 30, 4, 1900000],
    'never below one day' => [30, 1, 850000],
]);

it('issues stable tokens and detects tampering', function () {
    $car = Car::factory()->create(['daily_price' => 350000, 'deposit' => 500000]);
    $branch = Branch::query()->findOrFail($car->branch_id);
    $window = new RentalWindow(CarbonImmutable::parse('2026-12-03T02:00:00Z'), CarbonImmutable::parse('2026-12-04T02:00:00Z'));
    $tokens = new PriceToken;
    $price = (new PriceCalculator)->for($car, $window);

    $token = $tokens->issue($car, $branch, $window, $price);

    expect($token)->toMatch('/^[A-Za-z0-9_-]{43}$/')
        ->and($tokens->issue($car, $branch, $window, $price))->toBe($token)
        ->and($tokens->verify($token, $car, $branch, $window, $price))->toBeTrue()
        ->and($tokens->verify($token, $car, $branch, $window, PriceCalculator::compute(360000, 500000, 1440)))->toBeFalse()
        ->and($tokens->verify($token, $car, $branch, new RentalWindow($window->pickup, $window->return->addHour()), $price))->toBeFalse();
});
