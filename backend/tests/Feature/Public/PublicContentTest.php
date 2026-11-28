<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarModel3d;
use App\Models\Category;
use App\Models\Setting;
use App\Models\Testimonial;
use Carbon\CarbonImmutable;
use Database\Seeders\SettingsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Browser;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(CarbonImmutable::parse('2026-12-01T01:00:00Z'));
    $this->browser = new Browser($this);
});

describe('testimonials', function () {
    it('returns the six newest published testimonials, cacheable, without internal fields', function () {
        foreach (range(1, 8) as $i) {
            Testimonial::factory()->create(['name' => "Tamu {$i}", 'created_at' => now()->subDays(10 - $i)]);
        }
        Testimonial::factory()->count(2)->create(['is_published' => false, 'name' => 'Tersembunyi']);

        $response = $this->browser->get('/api/v1/public/testimonials')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300')
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta', null);

        expect($response->json('data.*.name'))->toBe(['Tamu 8', 'Tamu 7', 'Tamu 6', 'Tamu 5', 'Tamu 4', 'Tamu 3'])
            ->and(array_keys($response->json('data.0')))->toBe(['name', 'city', 'quote', 'rating', 'avatar_url', 'is_demo']);
    });

    it('keeps the demo flag and hides the booking link', function () {
        $booking = Booking::factory()->status(BookingStatus::Completed)->create();
        Testimonial::factory()->create(['booking_id' => $booking->id, 'is_demo' => true, 'avatar_path' => 'avatars/a.webp']);

        $item = $this->browser->get('/api/v1/public/testimonials')->assertOk()->json('data.0');

        expect($item['is_demo'])->toBeTrue()
            ->and($item)->not->toHaveKey('id')
            ->and($item)->not->toHaveKey('booking_id')
            ->and($item['avatar_url'])->toEndWith('/storage/avatars/a.webp');
    });

    it('returns an empty list when nothing is published', function () {
        Testimonial::factory()->create(['is_published' => false]);

        $this->browser->get('/api/v1/public/testimonials')
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath('errors', null);
    });
});

describe('stats', function () {
    it('counts active cars, active branches, categories and completed bookings', function () {
        $branch = Branch::factory()->create();
        Branch::factory()->create();
        Branch::factory()->create(['is_active' => false]);
        $categories = Category::factory()->count(4)->create();

        $cars = Car::factory()->count(3)->create(['branch_id' => $branch->id, 'category_id' => $categories[0]->id]);
        Car::factory()->inMaintenance()->create(['branch_id' => $branch->id, 'category_id' => $categories[0]->id]);
        Car::factory()->create(['branch_id' => $branch->id, 'category_id' => $categories[0]->id])->delete();

        $start = CarbonImmutable::parse('2026-10-01T02:00:00Z');
        $statuses = [BookingStatus::Completed, BookingStatus::Completed, BookingStatus::Cancelled, BookingStatus::Expired, BookingStatus::Rejected];
        foreach ($statuses as $i => $status) {
            Booking::factory()->forCar($cars[0], $start->addDays($i * 3), 1)->status($status)->create();
        }

        $this->browser->get('/api/v1/public/stats')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300')
            ->assertJsonPath('data', ['cars' => 3, 'branches' => 2, 'categories' => 4, 'completed_bookings' => 2]);
    });

    it('returns zeros for an empty database', function () {
        $this->browser->get('/api/v1/public/stats')
            ->assertOk()
            ->assertJsonPath('data', ['cars' => 0, 'branches' => 0, 'categories' => 0, 'completed_bookings' => 0]);
    });

    it('is public and rate limited with the error envelope', function () {
        foreach (range(1, 60) as $i) {
            $this->browser->get('/api/v1/public/stats')->assertOk();
        }

        $this->browser->get('/api/v1/public/stats')
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('code', 429)
            ->assertJsonPath('success', false);
    });
});

describe('settings', function () {
    it('returns the seeded defaults for the allowlisted keys only', function () {
        $data = $this->browser->get('/api/v1/public/settings')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300')
            ->json('data');

        expect($data)->toBe([
            'booking' => [
                'min_days' => 1,
                'max_days' => 30,
                'min_lead_minutes' => 120,
                'max_advance_days' => 90,
                'payment_window_minutes' => 120,
            ],
            'gps' => ['retention_days' => 90],
            'content' => ['terms_markdown' => SettingsSeeder::defaults()['content.terms_markdown']],
        ]);
    });

    it('prefers stored values and clamps numbers', function () {
        Setting::query()->insert([
            ['key' => 'booking.max_days', 'value' => json_encode(14), 'updated_at' => now()],
            ['key' => 'gps.retention_days', 'value' => json_encode(5000), 'updated_at' => now()],
            ['key' => 'booking.payment_window_minutes', 'value' => json_encode(1), 'updated_at' => now()],
            ['key' => 'content.terms_markdown', 'value' => json_encode('# S&K'), 'updated_at' => now()],
        ]);

        $this->browser->get('/api/v1/public/settings')
            ->assertOk()
            ->assertJsonPath('data.booking.max_days', 14)
            ->assertJsonPath('data.booking.payment_window_minutes', 5)
            ->assertJsonPath('data.gps.retention_days', 365)
            ->assertJsonPath('data.content.terms_markdown', '# S&K');
    });

    it('never exposes private keys', function () {
        $this->seed(SettingsSeeder::class);

        $body = $this->browser->get('/api/v1/public/settings')->assertOk()->getContent();

        expect($body)->not->toContain('bank_account')
            ->and($body)->not->toContain('1234567890')
            ->and($body)->not->toContain('max_open_per_customer')
            ->and($body)->not->toContain('prep_buffer')
            ->and($body)->not->toContain('offline_after');
    });

    it('caps a very long terms text', function () {
        Setting::query()->insert([
            'key' => 'content.terms_markdown',
            'value' => json_encode(str_repeat('a', 60_000)),
            'updated_at' => now(),
        ]);

        expect(mb_strlen($this->browser->get('/api/v1/public/settings')->json('data.content.terms_markdown')))
            ->toBe(50_000);
    });
});

describe('credits', function () {
    it('lists models of active cars by name without internal fields', function () {
        $branch = Branch::factory()->create();
        $category = Category::factory()->create();
        $zeta = Brand::factory()->create(['name' => 'Zeta', 'slug' => 'zeta']);
        $alpha = Brand::factory()->create(['name' => 'Alpha', 'slug' => 'alpha']);
        $base = ['branch_id' => $branch->id, 'category_id' => $category->id];

        $later = Car::factory()->create([...$base, 'brand_id' => $zeta->id, 'model_name' => 'Satu', 'year' => 2025]);
        $first = Car::factory()->create([...$base, 'brand_id' => $alpha->id, 'model_name' => 'Dua', 'year' => 2026]);
        $hidden = Car::factory()->inMaintenance()->create([...$base, 'brand_id' => $alpha->id]);
        $deleted = Car::factory()->create([...$base, 'brand_id' => $alpha->id]);

        CarModel3d::factory()->create(['car_id' => $later->id, 'source_name' => 'Studio Z', 'source_url' => 'https://example.com/z', 'license' => 'CC0']);
        CarModel3d::factory()->create(['car_id' => $first->id, 'is_illustrative' => false]);
        CarModel3d::factory()->create(['car_id' => $hidden->id]);
        CarModel3d::factory()->create(['car_id' => $deleted->id]);
        $deleted->delete();

        $response = $this->browser->get('/api/v1/public/credits')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=60, public, stale-while-revalidate=300');

        expect($response->json('data'))->toBe([
            [
                'car' => ['slug' => $first->slug, 'name' => 'Alpha Dua 2026'],
                'source_name' => 'Model contoh',
                'source_url' => null,
                'license' => 'CC-BY-4.0',
                'is_illustrative' => false,
            ],
            [
                'car' => ['slug' => $later->slug, 'name' => 'Zeta Satu 2025'],
                'source_name' => 'Studio Z',
                'source_url' => 'https://example.com/z',
                'license' => 'CC0',
                'is_illustrative' => true,
            ],
        ])->and($response->getContent())->not->toContain('file_path')
            ->and($response->getContent())->not->toContain('plate_number');
    });

    it('returns an empty list without models', function () {
        $this->browser->get('/api/v1/public/credits')->assertOk()->assertJsonPath('data', []);
    });
});
