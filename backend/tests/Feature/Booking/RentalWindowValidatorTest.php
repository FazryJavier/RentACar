<?php

use App\Domain\Booking\RentalWindowValidator;
use App\Exceptions\ApiValidationException;
use App\Models\Branch;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // 1 Dec 2026 08:00 WIB.
    $this->now = CarbonImmutable::parse('2026-12-01T01:00:00Z');
    $this->branch = Branch::factory()->create(['opening_time' => '07:00', 'closing_time' => '21:00']);
    $this->validator = app(RentalWindowValidator::class);
});

function windowErrors(callable $call): array
{
    try {
        $call();
    } catch (ApiValidationException $exception) {
        return collect($exception->apiErrors())->mapWithKeys(fn ($error) => [$error->field => $error->code])->all();
    }

    return [];
}

function validateWindow($test, string $pickup, string $return, ?Branch $branch = null): array
{
    return windowErrors(fn () => $test->validator->validate(['pickup_at' => $pickup, 'return_at' => $return], $branch ?? $test->branch, $test->now));
}

it('accepts a valid window and stores it in UTC', function () {
    $window = $this->validator->validate(
        ['pickup_at' => '2026-12-03T09:00:00+07:00', 'return_at' => '2026-12-04T09:00:00+07:00'],
        $this->branch,
        $this->now,
    );

    expect($window->pickup->toIso8601ZuluString())->toBe('2026-12-03T02:00:00Z')
        ->and($window->minutes())->toBe(1440);
});

it('reads values without an offset as WIB', function () {
    $window = $this->validator->validate(['pickup_at' => '2026-12-03T09:00', 'return_at' => '2026-12-04 09:00'], $this->branch, $this->now);

    expect($window->pickup->toIso8601ZuluString())->toBe('2026-12-03T02:00:00Z');
});

it('applies the lead time boundary', function () {
    expect(validateWindow($this, '2026-12-01T10:00:00+07:00', '2026-12-02T10:00:00+07:00'))->toBe([])
        ->and(validateWindow($this, '2026-12-01T09:30:00+07:00', '2026-12-02T09:30:00+07:00'))->toBe(['pickup_at' => 'too_soon']);
});

it('applies the advance limit', function () {
    expect(validateWindow($this, '2027-03-01T08:00:00+07:00', '2027-03-02T08:00:00+07:00'))->toBe([])
        ->and(validateWindow($this, '2027-03-01T08:30:00+07:00', '2027-03-02T08:30:00+07:00'))->toBe(['pickup_at' => 'too_far']);
});

it('requires half-hour slots', function () {
    expect(validateWindow($this, '2026-12-03T09:15:00+07:00', '2026-12-04T09:30:00+07:00'))->toBe(['pickup_at' => 'invalid_slot'])
        ->and(validateWindow($this, '2026-12-03T09:00:00+07:00', '2026-12-04T09:00:30+07:00'))->toBe(['return_at' => 'invalid_slot']);
});

it('checks operating hours in WIB, inclusive', function () {
    expect(validateWindow($this, '2026-12-03T07:00:00+07:00', '2026-12-04T21:00:00+07:00'))->toBe([])
        ->and(validateWindow($this, '2026-12-03T06:30:00+07:00', '2026-12-04T09:00:00+07:00'))->toBe(['pickup_at' => 'outside_operating_hours'])
        // 14:30 UTC is 21:30 WIB.
        ->and(validateWindow($this, '2026-12-03T09:00:00+07:00', '2026-12-04T14:30:00Z'))->toBe(['return_at' => 'outside_operating_hours']);
});

it('checks the duration limits', function (string $return, array $errors) {
    expect(validateWindow($this, '2026-12-03T09:00:00+07:00', $return))->toBe($errors);
})->with([
    '23.5 hours' => ['2026-12-04T08:30:00+07:00', ['return_at' => 'duration_out_of_range']],
    '24 hours' => ['2026-12-04T09:00:00+07:00', []],
    '30 days' => ['2027-01-02T09:00:00+07:00', []],
    '30 days + 30 min' => ['2027-01-02T09:30:00+07:00', ['return_at' => 'duration_out_of_range']],
    'before pickup' => ['2026-12-02T09:00:00+07:00', ['return_at' => 'duration_out_of_range']],
]);

it('reports required and invalid values', function () {
    expect(windowErrors(fn () => $this->validator->validate([], null, $this->now)))
        ->toBe(['branch' => 'required', 'pickup_at' => 'required', 'return_at' => 'required'])
        ->and(validateWindow($this, 'besok jam 9', '2026-12-04T09:00:00+07:00'))->toBe(['pickup_at' => 'invalid_format'])
        ->and(validateWindow($this, '2026-13-40T09:00:00+07:00', '2026-12-04T09:00:00+07:00'))->toBe(['pickup_at' => 'invalid_format']);
});

it('uses the settings table', function () {
    DB::table('settings')->updateOrInsert(['key' => 'booking.min_lead_minutes'], ['value' => json_encode(240), 'updated_at' => now()]);
    $validator = app(RentalWindowValidator::class);

    expect(windowErrors(fn () => $validator->validate(['pickup_at' => '2026-12-01T11:30:00+07:00', 'return_at' => '2026-12-02T11:30:00+07:00'], $this->branch, $this->now)))
        ->toBe(['pickup_at' => 'too_soon']);
});
