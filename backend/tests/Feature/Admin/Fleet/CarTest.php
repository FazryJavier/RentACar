<?php

use App\Models\Booking;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarModel3d;
use App\Models\CarPhoto;
use App\Models\Category;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\AdminBrowsers;
use Tests\Support\Browser;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->branchA = Branch::factory()->create(['name' => 'Cabang A']);
    $this->branchB = Branch::factory()->create(['name' => 'Cabang B']);
    $this->brand = Brand::factory()->create(['name' => 'Toyota', 'slug' => 'toyota']);
    $this->category = Category::factory()->create(['name' => 'SUV', 'slug' => 'suv']);
});

function carPayload(array $overrides = []): array
{
    return [
        'brand_id' => test()->brand->id,
        'category_id' => test()->category->id,
        'branch_id' => test()->branchA->id,
        'model_name' => 'Fortuner',
        'year' => 2023,
        'plate_number' => 'b 1234xyz',
        'color' => 'Hitam',
        'transmission' => 'automatic',
        'fuel_type' => 'diesel',
        'seats' => 7,
        'luggage_capacity' => 3,
        'daily_price' => 950000,
        'deposit' => 500000,
        'description' => 'SUV tangguh.',
        'features' => ['AC', ' Audio ', 'USB'],
        ...$overrides,
    ];
}

function staffOf(TestCase $test, Branch $branch): Browser
{
    return AdminBrowsers::staff($test, $admin, $branch);
}

describe('access', function () {
    it('requires an admin session', function () {
        $car = Car::factory()->create();

        (new Browser($this))->get('/api/v1/admin/cars')->assertUnauthorized();
        (new Browser($this))->get("/api/v1/admin/cars/{$car->id}")->assertUnauthorized();
    });

    it('rejects a customer session', function () {
        Customer::factory()->create(['email' => 'budi@example.test', 'password' => 'rahasia123']);
        $browser = new Browser($this);
        $browser->post('/api/v1/auth/login', ['email' => 'budi@example.test', 'password' => 'rahasia123'])->assertOk();

        $browser->get('/api/v1/admin/cars')->assertUnauthorized();
    });

    it('hides other branches from Staf with 404', function () {
        $other = Car::factory()->create(['branch_id' => $this->branchB->id, 'color' => 'Hitam']);
        $browser = staffOf($this, $this->branchA);

        $browser->get("/api/v1/admin/cars/{$other->id}")->assertNotFound();
        $browser->json('PATCH', "/api/v1/admin/cars/{$other->id}", ['color' => 'Putih', 'version' => 1])->assertNotFound();
        $browser->json('DELETE', "/api/v1/admin/cars/{$other->id}")->assertNotFound();
        expect($other->fresh()->color)->not->toBe('Putih')->and($other->fresh()->deleted_at)->toBeNull();
    });

    it('answers 404 for a soft-deleted car', function () {
        $car = Car::factory()->create();
        $car->delete();

        AdminBrowsers::superAdmin($this)->get("/api/v1/admin/cars/{$car->id}")->assertNotFound();
    });
});

describe('list', function () {
    it('lists cars of every branch for Super Admin with list fields and meta', function () {
        $car = Car::factory()->create(['branch_id' => $this->branchA->id, 'brand_id' => $this->brand->id]);
        Car::factory()->create(['branch_id' => $this->branchB->id]);
        CarPhoto::factory()->create(['car_id' => $car->id, 'variants' => ['480' => 'cars/1/a-480.webp', '960' => 'cars/1/a-960.webp', '1440' => 'cars/1/a-1440.webp'], 'path' => 'cars/1/a-1440.webp']);
        CarModel3d::factory()->create(['car_id' => $car->id]);

        $response = AdminBrowsers::superAdmin($this)->get('/api/v1/admin/cars?sort=created_at')->assertOk();

        $response->assertJsonPath('meta.total', 2)->assertJsonPath('meta.per_page', 25);
        $item = collect($response->json('data'))->firstWhere('id', $car->id);
        expect($item['brand']['name'])->toBe('Toyota')
            ->and($item['thumbnail_url'])->toEndWith('cars/1/a-480.webp')
            ->and($item['photos_count'])->toBe(1)
            ->and($item['has_3d'])->toBeTrue()
            ->and($item)->toHaveKeys(['plate_number', 'daily_price', 'status', 'category', 'branch']);
    });

    it('searches model, plate and brand name', function () {
        Car::factory()->create(['model_name' => 'Fortuner', 'plate_number' => 'B 1234 XYZ', 'brand_id' => $this->brand->id]);
        Car::factory()->create(['model_name' => 'Jazz', 'plate_number' => 'D 777 AB', 'brand_id' => Brand::factory()->create(['name' => 'Honda', 'slug' => 'honda'])->id]);
        $browser = AdminBrowsers::superAdmin($this);

        expect($browser->get('/api/v1/admin/cars?q=1234')->json('data.*.model_name'))->toBe(['Fortuner'])
            ->and($browser->get('/api/v1/admin/cars?q=honda')->json('data.*.model_name'))->toBe(['Jazz'])
            ->and($browser->get('/api/v1/admin/cars?q=jaz')->json('data.*.model_name'))->toBe(['Jazz']);
    });

    it('sorts by price and filters by status, category and brand', function () {
        Car::factory()->create(['daily_price' => 500000, 'category_id' => $this->category->id]);
        Car::factory()->create(['daily_price' => 300000, 'category_id' => $this->category->id]);
        Car::factory()->inMaintenance()->create(['daily_price' => 400000]);
        $browser = AdminBrowsers::superAdmin($this);

        expect($browser->get('/api/v1/admin/cars?sort=-daily_price')->json('data.*.daily_price'))->toBe([500000, 400000, 300000])
            ->and($browser->get('/api/v1/admin/cars?filter[status]=maintenance')->json('data.*.daily_price'))->toBe([400000])
            ->and($browser->get("/api/v1/admin/cars?filter[category_id]={$this->category->id}&sort=daily_price")->json('data.*.daily_price'))->toBe([300000, 500000]);
    });

    it('rejects unknown filters', function () {
        AdminBrowsers::superAdmin($this)->get('/api/v1/admin/cars?filter[color]=hitam')
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'filter.color');
    });

    it('limits Staf to their branch and ignores their branch filter', function () {
        Car::factory()->create(['branch_id' => $this->branchA->id]);
        Car::factory()->count(2)->create(['branch_id' => $this->branchB->id]);

        $response = staffOf($this, $this->branchA)->get("/api/v1/admin/cars?filter[branch_id]={$this->branchB->id}")->assertOk();

        expect($response->json('data.*.branch.id'))->toBe([$this->branchA->id]);
    });

    it('filters by branch for Super Admin', function () {
        Car::factory()->create(['branch_id' => $this->branchA->id]);
        Car::factory()->create(['branch_id' => $this->branchB->id]);

        $ids = AdminBrowsers::superAdmin($this)->get("/api/v1/admin/cars?filter[branch_id]={$this->branchB->id}")->json('data.*.branch.id');

        expect($ids)->toBe([$this->branchB->id]);
    });
});

describe('create and update', function () {
    it('creates a car with a normalised plate, slug, trimmed features and audit', function () {
        $response = AdminBrowsers::superAdmin($this)->post('/api/v1/admin/cars', carPayload())->assertCreated();

        $response->assertJsonPath('data.plate_number', 'B 1234 XYZ')
            ->assertJsonPath('data.slug', 'toyota-fortuner-2023-hitam')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.features', ['AC', 'Audio', 'USB'])
            ->assertJsonPath('data.branch.id', $this->branchA->id)
            ->assertJsonPath('data.photos', []);
        expect(DB::table('audit_logs')->where('action', 'admin.car.created')->count())->toBe(1);
    });

    it('adds a suffix to a taken slug, including soft-deleted cars', function () {
        $browser = AdminBrowsers::superAdmin($this);
        $first = $browser->post('/api/v1/admin/cars', carPayload())->assertCreated();
        Car::query()->find($first->json('data.id'))->delete();

        $browser->post('/api/v1/admin/cars', carPayload(['plate_number' => 'B 9 A']))
            ->assertCreated()->assertJsonPath('data.slug', 'toyota-fortuner-2023-hitam-2');
    });

    it('keeps the slug when the car is edited', function () {
        $browser = AdminBrowsers::superAdmin($this);
        $id = $browser->post('/api/v1/admin/cars', carPayload())->json('data.id');

        $browser->json('PATCH', "/api/v1/admin/cars/{$id}", ['color' => 'Putih', 'version' => 1])
            ->assertOk()->assertJsonPath('data.slug', 'toyota-fortuner-2023-hitam')->assertJsonPath('data.color', 'Putih');
    });

    it('validates year boundaries using the WIB year', function (int $year, bool $ok) {
        $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 12, 31)->setTime(17, 30)); // 1 Jan 2027 00:30 WIB
        $response = AdminBrowsers::superAdmin($this)->post('/api/v1/admin/cars', carPayload(['year' => $year]));

        $ok ? $response->assertCreated() : $response->assertUnprocessable()->assertJsonPath('errors.0.field', 'year');
    })->with([[1999, false], [2000, true], [2028, true], [2029, false]]);

    it('validates numeric boundaries', function (string $field, int $value, bool $ok) {
        $response = AdminBrowsers::superAdmin($this)->post('/api/v1/admin/cars', carPayload([$field => $value]));

        $ok ? $response->assertCreated() : $response->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
    })->with([
        ['seats', 1, false], ['seats', 2, true], ['seats', 16, true], ['seats', 17, false],
        ['daily_price', 99999, false], ['daily_price', 100000, true], ['daily_price', 10000000, true], ['daily_price', 10000001, false],
        ['deposit', -1, false], ['deposit', 0, true], ['deposit', 10000000, true], ['deposit', 10000001, false],
    ]);

    it('rejects invalid plates', function (string $plate) {
        AdminBrowsers::superAdmin($this)->post('/api/v1/admin/cars', carPayload(['plate_number' => $plate]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.0.field', 'plate_number')
            ->assertJsonPath('errors.0.code', 'invalid_format');
    })->with(['1234 XYZ', 'ABC 12345', 'B 12345', 'B 1234 WXYZ', 'B-1234-XYZ!']);

    it('rejects a duplicate plate in another spelling, and allows it after soft delete', function () {
        $existing = Car::factory()->create(['plate_number' => 'B 1234 XYZ']);
        $browser = AdminBrowsers::superAdmin($this);

        $browser->post('/api/v1/admin/cars', carPayload(['plate_number' => 'b1234xyz']))
            ->assertUnprocessable()->assertJsonPath('errors.0.code', 'not_unique');

        $existing->delete();
        $browser->post('/api/v1/admin/cars', carPayload(['plate_number' => 'b1234xyz']))->assertCreated();
    });

    it('rejects too many or duplicate features', function () {
        $browser = AdminBrowsers::superAdmin($this);

        $browser->post('/api/v1/admin/cars', carPayload(['features' => array_map(fn ($i) => "F{$i}", range(1, 13))]))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'features');
        $browser->post('/api/v1/admin/cars', carPayload(['features' => ['AC', 'ac']]))
            ->assertUnprocessable();
    });

    it('requires a branch from Super Admin', function () {
        AdminBrowsers::superAdmin($this)->post('/api/v1/admin/cars', carPayload(['branch_id' => null]))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'branch_id');
    });

    it('always uses the Staf branch', function () {
        $browser = staffOf($this, $this->branchA);
        $id = $browser->post('/api/v1/admin/cars', carPayload(['branch_id' => $this->branchB->id]))
            ->assertCreated()->assertJsonPath('data.branch.id', $this->branchA->id)->json('data.id');

        $browser->json('PATCH', "/api/v1/admin/cars/{$id}", ['branch_id' => $this->branchB->id, 'version' => 1])
            ->assertOk()->assertJsonPath('data.branch.id', $this->branchA->id);
    });

    it('requires a version and rejects a stale one', function () {
        $car = Car::factory()->create();
        $browser = AdminBrowsers::superAdmin($this);

        $browser->json('PATCH', "/api/v1/admin/cars/{$car->id}", ['color' => 'Merah'])
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'version');
        $browser->json('PATCH', "/api/v1/admin/cars/{$car->id}", ['color' => 'Merah', 'version' => 1])
            ->assertOk()->assertJsonPath('data.version', 2);
        $browser->json('PATCH', "/api/v1/admin/cars/{$car->id}", ['color' => 'Biru', 'version' => 1])
            ->assertStatus(409)->assertJsonPath('errors.0.code', 'version_conflict');
        expect($car->fresh()->color)->toBe('Merah');
    });

    it('audits changed fields', function () {
        $car = Car::factory()->create(['daily_price' => 500000]);

        AdminBrowsers::superAdmin($this)->json('PATCH', "/api/v1/admin/cars/{$car->id}", ['daily_price' => 600000, 'version' => 1])->assertOk();

        $log = DB::table('audit_logs')->where('action', 'admin.car.updated')->first();
        expect(json_decode($log->changes, true))->toBe(['daily_price' => [500000, 600000]]);
    });

    it('blocks moving a car with bookings to another branch', function () {
        $car = Car::factory()->create(['branch_id' => $this->branchA->id]);
        Booking::factory()->forCar($car, now()->toImmutable()->addDays(5))->create();

        AdminBrowsers::superAdmin($this)->json('PATCH', "/api/v1/admin/cars/{$car->id}", ['branch_id' => $this->branchB->id, 'version' => 1])
            ->assertStatus(409)->assertJsonPath('errors.0.code', 'car_has_active_bookings');
        expect($car->fresh()->branch_id)->toBe($this->branchA->id);
    });
});
