<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarModel3d;
use App\Models\CarPhoto;
use App\Models\Category;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

beforeEach(function () {
    // 1 Dec 2026 08:00 WIB.
    $this->travelTo(CarbonImmutable::parse('2026-12-01T01:00:00Z'));
    $this->browser = new Browser($this);
    $this->branch = Branch::factory()->create(['slug' => 'jakarta', 'name' => 'Jakarta', 'opening_time' => '07:00', 'closing_time' => '21:00']);
    $this->suv = Category::factory()->create(['name' => 'SUV', 'slug' => 'suv', 'sort_order' => 1]);
    $this->mpv = Category::factory()->create(['name' => 'MPV', 'slug' => 'mpv', 'sort_order' => 2]);
    $this->toyota = Brand::factory()->create(['name' => 'Toyota', 'slug' => 'toyota']);
});

function publicCar(array $attributes = []): Car
{
    return Car::factory()->create([
        'branch_id' => test()->branch->id,
        'category_id' => test()->suv->id,
        'brand_id' => test()->toyota->id,
        'daily_price' => 350000,
        'deposit' => 500000,
        ...$attributes,
    ]);
}

/** A booking on the car from $pickup (UTC ISO) for $hours, blocked 2 h after return. */
function bookingOn(Car $car, string $pickup, int $hours, BookingStatus $status = BookingStatus::Confirmed, array $extra = []): Booking
{
    $start = CarbonImmutable::parse($pickup);
    $days = max(1, (int) ceil($hours / 24));

    return Booking::factory()->forCar($car, $start, $days)->status($status)->create([
        'return_at' => $start->addHours($hours),
        'blocked_until' => $start->addHours($hours)->addHours(2),
        ...$extra,
    ]);
}

function search(string $pickup = '2026-12-03T09:00:00+07:00', string $return = '2026-12-04T09:00:00+07:00', string $extra = ''): string
{
    return '/api/v1/public/cars?branch=jakarta&pickup_at='.urlencode($pickup).'&return_at='.urlencode($return).$extra;
}

describe('catalog', function () {
    it('lists active cars without dates, cacheable, without private fields', function () {
        $cars = collect([publicCar(), publicCar(), publicCar()]);
        publicCar()->update(['status' => 'maintenance']);
        publicCar()->delete();

        $response = $this->browser->get('/api/v1/public/cars')->assertOk();

        $response->assertJsonPath('meta.total', 3)->assertJsonPath('meta.per_page', 12)
            ->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300');
        $item = $response->json('data.0');
        expect($item['estimate'])->toBeNull()
            ->and($item)->not->toHaveKeys(['id', 'plate_number', 'version'])
            ->and($item['brand'])->toBe(['slug' => 'toyota', 'name' => 'Toyota'])
            ->and($item['branch'])->toBe(['slug' => 'jakarta', 'name' => 'Jakarta', 'city' => $this->branch->city])
            ->and(collect($response->json('data.*.slug'))->sort()->values()->all())->toBe($cars->pluck('slug')->sort()->values()->all());
    });

    it('builds the thumbnail from processed photos', function () {
        $car = publicCar();
        CarPhoto::factory()->create(['car_id' => $car->id, 'sort_order' => 0, 'alt_text' => 'Depan', 'path' => 'cars/1/a-1440.webp', 'variants' => ['480' => 'cars/1/a-480.webp', '960' => 'cars/1/a-960.webp', '1440' => 'cars/1/a-1440.webp']]);
        CarModel3d::factory()->create(['car_id' => $car->id]);

        $item = $this->browser->get('/api/v1/public/cars')->json('data.0');

        expect($item['thumbnail'])->toBe([
            'url' => '/storage/cars/1/a-960.webp',
            'srcset' => '/storage/cars/1/a-480.webp 480w, /storage/cars/1/a-960.webp 960w, /storage/cars/1/a-1440.webp 1440w',
            'alt' => 'Depan',
        ])->and($item['has_3d'])->toBeTrue();
    });

    it('filters and sorts', function () {
        $cheapSuv = publicCar(['daily_price' => 300000, 'transmission' => 'automatic', 'seats' => 7, 'fuel_type' => 'diesel']);
        publicCar(['daily_price' => 600000, 'transmission' => 'automatic', 'seats' => 7, 'fuel_type' => 'diesel']);
        publicCar(['daily_price' => 250000, 'transmission' => 'manual', 'seats' => 5, 'fuel_type' => 'gasoline', 'category_id' => $this->mpv->id]);
        $b = $this->browser;

        expect($b->get('/api/v1/public/cars?filter[category]=suv&filter[transmission]=automatic&filter[price_max]=500000')->json('data.*.slug'))->toBe([$cheapSuv->slug])
            ->and($b->get('/api/v1/public/cars?sort=price')->json('data.*.daily_price'))->toBe([250000, 300000, 600000])
            ->and($b->get('/api/v1/public/cars?sort=-price')->json('data.*.daily_price'))->toBe([600000, 300000, 250000])
            ->and($b->get('/api/v1/public/cars?filter[seats_min]=6&sort=price')->json('data.*.daily_price'))->toBe([300000, 600000])
            ->and($b->get('/api/v1/public/cars?filter[fuel_type]=gasoline,electric')->json('data.*.daily_price'))->toBe([250000])
            ->and($b->get('/api/v1/public/cars?filter[brand][]=toyota&filter[category][]=mpv')->json('data.*.daily_price'))->toBe([250000])
            ->and($b->get('/api/v1/public/cars?filter[price_min]=300000&sort=price')->json('data.*.daily_price'))->toBe([300000, 600000]);
    });

    it('sorts by popularity by default and newest on request', function () {
        $old = publicCar(['completed_bookings_count' => 9, 'created_at' => now()->subDays(5)]);
        $new = publicCar(['completed_bookings_count' => 1, 'created_at' => now()]);

        expect($this->browser->get('/api/v1/public/cars')->json('data.*.slug'))->toBe([$old->slug, $new->slug])
            ->and($this->browser->get('/api/v1/public/cars?sort=popular')->json('data.*.slug'))->toBe([$old->slug, $new->slug])
            ->and($this->browser->get('/api/v1/public/cars?sort=-newest')->json('data.*.slug'))->toBe([$new->slug, $old->slug]);
    });

    it('rejects unknown filters and invalid values', function (string $query, string $field, string $code) {
        $this->browser->get('/api/v1/public/cars?'.$query)
            ->assertUnprocessable()->assertJsonPath('errors.0.field', $field)->assertJsonPath('errors.0.code', $code);
    })->with([
        ['filter[color]=hitam', 'filter.color', 'unknown_filter'],
        ['filter[transmission]=semi', 'filter.transmission', 'invalid_format'],
        ['filter[seats_min]=20', 'filter.seats_min', 'out_of_range'],
        ['filter[price_min]=500000&filter[price_max]=100000', 'filter.price_min', 'out_of_range'],
        ['filter[category]=SUV!', 'filter.category', 'invalid_format'],
        ['branch=tidak-ada', 'branch', 'invalid'],
    ]);

    it('uses the public page sizes', function () {
        foreach (range(1, 13) as $i) {
            publicCar();
        }

        expect($this->browser->get('/api/v1/public/cars')->json('data'))->toHaveCount(12)
            ->and($this->browser->get('/api/v1/public/cars?per_page=24')->json('meta.per_page'))->toBe(24)
            ->and($this->browser->get('/api/v1/public/cars?per_page=25')->json('meta.per_page'))->toBe(12);
    });
});

describe('availability search', function () {
    it('returns available cars with an estimate and no-store', function () {
        $free = publicCar();
        $booked = publicCar();
        bookingOn($booked, '2026-12-03T01:00:00Z', 24);
        publicCar(['branch_id' => Branch::factory()->create()->id]);

        $response = $this->browser->get(search())->assertOk();

        expect($response->json('data.*.slug'))->toBe([$free->slug])
            ->and($response->json('data.0.estimate'))->toBe(['rental_days' => 1, 'rental_subtotal' => 350000, 'deposit' => 500000, 'total_amount' => 850000]);
        $response->assertHeader('Cache-Control', 'no-store, private');
    });

    it('honours the preparation buffer after an earlier rental', function () {
        $car = publicCar();
        // Returns 3 Dec 10:00 WIB (03:00 UTC), blocked until 12:00 WIB.
        bookingOn($car, '2026-12-02T03:00:00Z', 24);

        expect($this->browser->get(search('2026-12-03T11:30:00+07:00', '2026-12-04T11:30:00+07:00'))->json('data'))->toBe([])
            ->and($this->browser->get(search('2026-12-03T12:00:00+07:00', '2026-12-04T12:00:00+07:00'))->json('data.*.slug'))->toBe([$car->slug]);
    });

    it('honours the buffer before a later rental', function () {
        $car = publicCar();
        // Starts 5 Dec 14:00 WIB.
        bookingOn($car, '2026-12-05T07:00:00Z', 24);

        expect($this->browser->get(search('2026-12-04T12:30:00+07:00', '2026-12-05T12:30:00+07:00'))->json('data'))->toBe([])
            ->and($this->browser->get(search('2026-12-04T12:00:00+07:00', '2026-12-05T12:00:00+07:00'))->json('data.*.slug'))->toBe([$car->slug]);
    });

    it('only counts schedule-holding bookings', function (BookingStatus $status, bool $blocks, array $extra = []) {
        $car = publicCar();
        bookingOn($car, '2026-12-03T01:00:00Z', 24, $status, $extra);

        expect($this->browser->get(search())->json('data.*.slug'))->toBe($blocks ? [] : [$car->slug]);
    })->with([
        'pending payment' => [BookingStatus::PendingPayment, true],
        'pending payment past deadline' => [BookingStatus::PendingPayment, false, ['payment_deadline' => CarbonImmutable::parse('2026-12-01T00:30:00Z')]],
        'pending verification' => [BookingStatus::PendingVerification, true],
        'confirmed' => [BookingStatus::Confirmed, true],
        'ongoing' => [BookingStatus::Ongoing, true],
        'completed' => [BookingStatus::Completed, false],
        'cancelled' => [BookingStatus::Cancelled, false],
        'rejected' => [BookingStatus::Rejected, false],
        'expired' => [BookingStatus::Expired, false],
    ]);

    it('validates the window and requires a branch', function () {
        $this->browser->get('/api/v1/public/cars?pickup_at='.urlencode('2026-12-03T09:00:00+07:00').'&return_at='.urlencode('2026-12-04T09:00:00+07:00'))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'branch')->assertJsonPath('errors.0.code', 'required');
        $this->browser->get(search('2026-12-01T09:00:00+07:00', '2026-12-02T09:00:00+07:00'))
            ->assertUnprocessable()->assertJsonPath('errors.0.code', 'too_soon');
    });
});

describe('detail, availability and similar', function () {
    it('shows public details without private data or resolved markers', function () {
        $car = publicCar(['plate_number' => 'B 1234 XYZ', 'odometer_km' => 45000, 'last_inspected_at' => CarbonImmutable::parse('2026-11-20T02:00:00Z')]);
        $model = CarModel3d::factory()->create(['car_id' => $car->id, 'model_version' => 2, 'camera' => ['position' => [1, 2, 3], 'target' => [0, 0, 0]], 'license' => 'CC-BY-4.0']);
        CarCondition::factory()->create(['car_id' => $car->id, 'severity' => 'minor', 'position' => [0, 1, 0], 'normal' => [0, 1, 0], 'model_version' => 2, 'created_at' => now()->subDays(2)]);
        CarCondition::factory()->create(['car_id' => $car->id, 'severity' => 'major', 'position' => [1, 1, 0], 'normal' => [0, 1, 0], 'model_version' => 1, 'created_at' => now()->subDay()]);
        CarCondition::factory()->create(['car_id' => $car->id, 'severity' => 'moderate', 'is_resolved' => true, 'resolved_at' => now()]);

        $response = $this->browser->get("/api/v1/public/cars/{$car->slug}")->assertOk();
        $data = $response->json('data');

        expect($response->content())->not->toContain('B 1234 XYZ')
            ->and($data)->not->toHaveKeys(['id', 'plate_number', 'version'])
            ->and($data['model_3d']['credit']['license'])->toBe('CC-BY-4.0')
            ->and($data['model_3d']['camera'])->toBe(['position' => [1, 2, 3], 'target' => [0, 0, 0]])
            ->and(array_column($data['conditions'], 'number'))->toBe([1, 2])
            ->and(array_column($data['conditions'], 'severity'))->toBe(['minor', 'major'])
            ->and($data['conditions'][1]['needs_reposition'])->toBeTrue()
            ->and($data['conditions'][1]['position'])->toBeNull()
            ->and($data['inspection_summary'])->toBe([
                'last_inspected_at' => '2026-11-20T02:00:00Z',
                'active_conditions' => ['minor' => 1, 'moderate' => 0, 'major' => 1],
                'odometer_km' => 45000,
            ]);
        expect($model->id)->not->toBeIn(array_values(array_filter($data, 'is_int')));
        $response->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300');
    });

    it('hides cars that are not public', function (string $state) {
        $car = publicCar();
        $state === 'deleted' ? $car->delete() : $car->update(['status' => $state]);

        $this->browser->get("/api/v1/public/cars/{$car->slug}")->assertNotFound();
    })->with(['maintenance', 'inactive', 'deleted']);

    it('checks one car and returns the price and token', function () {
        $car = publicCar();
        $url = "/api/v1/public/cars/{$car->slug}/availability?branch=jakarta&pickup_at=".urlencode('2026-12-03T09:00:00+07:00').'&return_at='.urlencode('2026-12-04T10:00:00+07:00');

        $response = $this->browser->get($url)->assertOk();
        $response->assertJsonPath('data.available', true)->assertJsonPath('data.reason', null)
            ->assertJsonPath('data.price', ['daily_price' => 350000, 'rental_days' => 2, 'rental_subtotal' => 700000, 'deposit' => 500000, 'total_amount' => 1200000])
            ->assertHeader('Cache-Control', 'no-store, private');
        expect($response->json('data.price_token'))->toBeString()->toHaveLength(43);

        bookingOn($car, '2026-12-03T05:00:00Z', 5);
        $this->browser->get($url)->assertJsonPath('data.available', false)->assertJsonPath('data.reason', 'booked');

        $other = Branch::factory()->create(['slug' => 'bandung']);
        $this->browser->get(str_replace('branch=jakarta', 'branch=bandung', $url))->assertJsonPath('data.reason', 'other_branch');
        expect($other->id)->toBeInt();
    });

    it('lists similar cars of the same category by price closeness', function () {
        $car = publicCar(['daily_price' => 400000]);
        $near = publicCar(['daily_price' => 420000]);
        $far = publicCar(['daily_price' => 900000]);
        publicCar(['category_id' => $this->mpv->id, 'daily_price' => 400000]);

        expect($this->browser->get("/api/v1/public/cars/{$car->slug}/similar")->json('data.*.slug'))->toBe([$near->slug, $far->slug]);

        bookingOn($near, '2026-12-03T01:00:00Z', 24);
        $withDates = $this->browser->get("/api/v1/public/cars/{$car->slug}/similar?branch=jakarta&pickup_at=".urlencode('2026-12-03T09:00:00+07:00').'&return_at='.urlencode('2026-12-04T09:00:00+07:00'));
        expect($withDates->json('data.*.slug'))->toBe([$far->slug])
            ->and($withDates->json('data.0.estimate.total_amount'))->toBe(1400000);
    });
});

describe('reference lists and limits', function () {
    it('lists active branches, categories by order and brands', function () {
        Branch::factory()->create(['is_active' => false, 'name' => 'Tutup']);

        expect($this->browser->get('/api/v1/public/branches')->json('data.*.slug'))->toBe(['jakarta'])
            ->and($this->browser->get('/api/v1/public/branches')->json('data.0'))->not->toHaveKey('id')
            ->and($this->browser->get('/api/v1/public/categories')->json('data.*.slug'))->toBe(['suv', 'mpv'])
            ->and($this->browser->get('/api/v1/public/brands')->json('data.0'))->toBe(['slug' => 'toyota', 'name' => 'Toyota', 'logo_url' => null]);
    });

    it('rate limits public requests per IP', function () {
        foreach (range(1, 60) as $i) {
            $this->browser->get('/api/v1/public/categories')->assertOk();
        }

        $this->browser->get('/api/v1/public/categories')->assertStatus(429)->assertHeader('Retry-After');
    });
});
