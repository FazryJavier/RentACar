<?php

use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarConditionPhoto;
use App\Models\CarModel3d;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\AdminBrowsers;
use Tests\Support\Browser;
use Tests\Support\TestImages;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->branch = Branch::factory()->create();
    $this->car = Car::factory()->create(['branch_id' => $this->branch->id]);
    $this->browser = AdminBrowsers::staff($this, $this->admin, $this->branch);
});

function markerPayload(array $overrides = []): array
{
    return [
        'area' => 'left',
        'severity' => 'minor',
        'description' => 'Baret halus di pintu kiri',
        'inspected_on' => '2026-11-20',
        ...$overrides,
    ];
}

function withModel(Car $car, int $version = 1): CarModel3d
{
    return CarModel3d::factory()->create(['car_id' => $car->id, 'model_version' => $version]);
}

describe('create', function () {
    it('places a marker on the current model version', function () {
        withModel($this->car, 2);

        $response = $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload([
            'position' => [0.40004, 0.8, -1.1], 'normal' => [0, 0, -1],
        ]))->assertCreated();

        $response->assertJsonPath('data.number', 1)
            ->assertJsonPath('data.model_version', 2)
            ->assertJsonPath('data.needs_reposition', false)
            ->assertJsonPath('data.position', [0.4, 0.8, -1.1])
            ->assertJsonPath('data.is_resolved', false);
        expect(CarCondition::query()->first()->created_by_admin_id)->toBe($this->admin->id)
            ->and(DB::table('audit_logs')->where('action', 'admin.car.condition_created')->count())->toBe(1);
    });

    it('requires a point when the car has a model', function () {
        withModel($this->car);

        $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload())
            ->assertUnprocessable()
            ->assertJsonPath('errors.0.field', 'position')
            ->assertJsonPath('errors.0.message', 'Klik titik pada model');
    });

    it('stores area-only markers without a model and rejects a point', function () {
        $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload(['area' => 'roof']))
            ->assertCreated()->assertJsonPath('data.position', null)->assertJsonPath('data.needs_reposition', false);

        $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload(['position' => [0, 0, 0], 'normal' => [0, 1, 0]]))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'position');
    });

    it('uses the WIB date for the inspection date', function () {
        $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 11, 26)->setTime(23, 30));
        // Sign in again at the new time (the session started before the time travel).
        $this->browser = AdminBrowsers::login($this, $this->admin);

        $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload(['inspected_on' => '2026-11-27']))->assertCreated();
        $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload(['inspected_on' => '2026-11-28']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.0.field', 'inspected_on')
            ->assertJsonPath('errors.0.message', 'Tanggal inspeksi tidak boleh di masa depan');
    });

    it('validates fields', function (array $overrides, string $field) {
        $this->browser->post("/api/v1/admin/cars/{$this->car->id}/conditions", markerPayload($overrides))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
    })->with([
        [['description' => 'abcd'], 'description'],
        [['description' => str_repeat('a', 301)], 'description'],
        [['area' => 'bonnet'], 'area'],
        [['severity' => 'severe'], 'severity'],
        [['inspected_on' => '20-11-2026'], 'inspected_on'],
    ]);

    it('hides other branches and other cars', function () {
        $other = Car::factory()->create();
        $foreign = CarCondition::factory()->create(['car_id' => Car::factory()->create(['branch_id' => $this->branch->id])->id]);

        $this->browser->post("/api/v1/admin/cars/{$other->id}/conditions", markerPayload())->assertNotFound();
        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/conditions/{$foreign->id}", ['severity' => 'major'])->assertNotFound();
        (new Browser($this))->get("/api/v1/admin/cars/{$this->car->id}/conditions")->assertUnauthorized();
    });
});

describe('list, reposition, resolve and delete', function () {
    it('numbers markers and flags those placed on an older model', function () {
        withModel($this->car, 2);
        CarCondition::factory()->create(['car_id' => $this->car->id, 'position' => [0, 1, 0], 'normal' => [0, 1, 0], 'model_version' => 1, 'created_at' => now()->subDay()]);
        CarCondition::factory()->create(['car_id' => $this->car->id, 'position' => [1, 1, 0], 'normal' => [0, 1, 0], 'model_version' => 2]);
        CarCondition::factory()->create(['car_id' => $this->car->id, 'is_resolved' => true, 'resolved_at' => now()]);

        $data = $this->browser->get("/api/v1/admin/cars/{$this->car->id}/conditions")->assertOk()->json('data');

        expect(array_column($data, 'number'))->toBe([1, 2, 3])
            ->and(array_column($data, 'needs_reposition'))->toBe([true, false, false])
            ->and($data[2]['is_resolved'])->toBeTrue();
    });

    it('repositions a marker onto the current model', function () {
        withModel($this->car, 2);
        $marker = CarCondition::factory()->create(['car_id' => $this->car->id, 'position' => [0, 1, 0], 'normal' => [0, 1, 0], 'model_version' => 1]);

        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/conditions/{$marker->id}", ['position' => [0.2, 1, 0], 'normal' => [0, 1, 0]])
            ->assertOk()->assertJsonPath('data.model_version', 2)->assertJsonPath('data.needs_reposition', false);
    });

    it('resolves and unresolves while keeping the marker', function () {
        $marker = CarCondition::factory()->create(['car_id' => $this->car->id]);

        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/conditions/{$marker->id}", ['is_resolved' => true])
            ->assertOk()->assertJsonPath('data.is_resolved', true);
        expect($marker->fresh()->resolved_at)->not->toBeNull();
        $log = DB::table('audit_logs')->where('action', 'admin.car.condition_updated')->first();
        expect(json_decode($log->changes, true)['is_resolved'])->toBe([false, true]);

        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/conditions/{$marker->id}", ['is_resolved' => false])->assertOk();
        expect($marker->fresh()->resolved_at)->toBeNull();
        expect($this->browser->get("/api/v1/admin/cars/{$this->car->id}/conditions")->json('data'))->toHaveCount(1);
    });

    it('deletes a marker with its photos', function () {
        $marker = CarCondition::factory()->create(['car_id' => $this->car->id]);
        Storage::disk('public')->put('cars/x/a.webp', 'x');
        CarConditionPhoto::query()->create(['car_condition_id' => $marker->id, 'path' => 'cars/x/a.webp', 'sort_order' => 0]);

        $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}/conditions/{$marker->id}")->assertOk();

        expect(CarCondition::query()->count())->toBe(0)->and(CarConditionPhoto::query()->count())->toBe(0);
        Storage::disk('public')->assertMissing('cars/x/a.webp');
        expect(DB::table('audit_logs')->where('action', 'admin.car.condition_deleted')->count())->toBe(1);
    });
});

describe('photos', function () {
    beforeEach(function () {
        $this->marker = CarCondition::factory()->create(['car_id' => $this->car->id]);
        $this->url = "/api/v1/admin/cars/{$this->car->id}/conditions/{$this->marker->id}/photos";
    });

    it('stores a WebP without metadata, at most three', function () {
        $response = $this->browser->upload($this->url, ['photo' => TestImages::upload('a.jpg', TestImages::jpeg(2000, 1200, withExif: true))])->assertCreated();
        $path = CarConditionPhoto::query()->firstOrFail()->path;
        $bytes = Storage::disk('public')->get($path);
        expect(getimagesizefromstring($bytes)['mime'])->toBe('image/webp')
            ->and(getimagesizefromstring($bytes)[0])->toBe(1280)
            ->and($bytes)->not->toContain('TestCam')
            ->and($response->json('data.photos.0.url'))->toEndWith($path);

        $this->browser->upload($this->url, ['photo' => TestImages::upload('b.png', TestImages::png())])->assertCreated();
        $this->browser->upload($this->url, ['photo' => TestImages::upload('c.webp', TestImages::webp())])->assertCreated();
        $this->browser->upload($this->url, ['photo' => TestImages::upload('d.jpg', TestImages::jpeg())])
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'photo');
        expect(CarConditionPhoto::query()->count())->toBe(3);
    });

    it('rejects fake images, large files and huge dimensions', function (string $name, string $bytes) {
        $this->browser->upload($this->url, ['photo' => TestImages::upload($name, $bytes)])
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'photo');
    })->with([
        ['x.jpg', 'bukan gambar'],
        ['big.jpg', TestImages::padTo(TestImages::jpeg(), 2 * 1024 * 1024 + 1)],
        ['wide.png', TestImages::png(4001, 2)],
    ]);

    it('deletes a photo', function () {
        $this->browser->upload($this->url, ['photo' => TestImages::upload('a.jpg', TestImages::jpeg())])->assertCreated();
        $photo = CarConditionPhoto::query()->firstOrFail();

        $this->browser->json('DELETE', "{$this->url}/{$photo->id}")->assertOk()->assertJsonPath('data.photos', []);
        Storage::disk('public')->assertMissing($photo->path);
    });
});
