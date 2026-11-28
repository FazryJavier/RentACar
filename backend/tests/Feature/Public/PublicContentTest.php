<?php

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Category;
use App\Models\Testimonial;
use Carbon\CarbonImmutable;
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
