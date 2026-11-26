<?php

use App\Jobs\ProcessCarPhoto;
use App\Models\Branch;
use App\Models\Brand;
use App\Models\Car;
use App\Models\CarPhoto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\Support\AdminBrowsers;
use Tests\Support\Browser;
use Tests\Support\TestImages;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
    $this->branch = Branch::factory()->create();
    $brand = Brand::factory()->create(['name' => 'Toyota', 'slug' => 'toyota']);
    $this->car = Car::factory()->create(['branch_id' => $this->branch->id, 'brand_id' => $brand->id, 'model_name' => 'Avanza', 'year' => 2022, 'color' => 'Silver']);
    $this->browser = AdminBrowsers::staff($this, $admin, $this->branch);
});

function uploadPhoto(Browser $browser, int $carId, $file, array $data = [])
{
    return $browser->upload("/api/v1/admin/cars/{$carId}/photos", ['photo' => $file], $data);
}

function processedPhoto(Car $car, int $order): CarPhoto
{
    return CarPhoto::factory()->create(['car_id' => $car->id, 'sort_order' => $order]);
}

describe('upload', function () {
    it('accepts JPG, PNG and WebP and processes them', function (string $name, string $bytes) {
        $response = uploadPhoto($this->browser, $this->car->id, TestImages::upload($name, $bytes))->assertCreated();

        $photo = CarPhoto::query()->findOrFail($response->json('data.id'));
        expect($photo->isProcessed())->toBeTrue()->and($photo->variants)->toHaveKeys(['480', '960', '1440']);
        expect(DB::table('audit_logs')->where('action', 'admin.car.photo_added')->count())->toBe(1);
    })->with([
        ['depan.jpg', TestImages::jpeg()],
        ['depan.png', TestImages::png()],
        ['depan.webp', TestImages::webp()],
    ]);

    it('answers 201 with a processing photo while the job is queued', function () {
        Queue::fake();
        $this->car->photos()->saveMany([processedPhoto($this->car, 0), processedPhoto($this->car, 1)]);

        uploadPhoto($this->browser, $this->car->id, TestImages::upload('a.jpg', TestImages::jpeg()))
            ->assertCreated()
            ->assertJsonPath('data.sort_order', 2)
            ->assertJsonPath('data.processing', true)
            ->assertJsonPath('data.urls', null)
            ->assertJsonPath('data.alt_text', 'Toyota Avanza 2022 Silver — foto 3');

        Queue::assertPushed(ProcessCarPhoto::class);
        $photo = CarPhoto::query()->where('car_id', $this->car->id)->where('sort_order', 2)->first();
        Storage::disk('local')->assertExists($photo->path);
        expect($photo->path)->toStartWith('car-photos/originals/')->not->toContain('a.jpg');
    });

    it('keeps a custom alt text', function () {
        Queue::fake();

        uploadPhoto($this->browser, $this->car->id, TestImages::upload('a.jpg', TestImages::jpeg()), ['alt_text' => 'Tampak depan'])
            ->assertCreated()->assertJsonPath('data.alt_text', 'Tampak depan');
    });

    it('accepts exactly 2 MB and rejects one byte more', function () {
        Queue::fake();
        $limit = 2 * 1024 * 1024;

        uploadPhoto($this->browser, $this->car->id, TestImages::upload('a.jpg', TestImages::padTo(TestImages::jpeg(), $limit)))->assertCreated();
        uploadPhoto($this->browser, $this->car->id, TestImages::upload('b.jpg', TestImages::padTo(TestImages::jpeg(), $limit + 1)))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'photo')->assertJsonPath('errors.0.code', 'file_too_large');
    });

    it('rejects a fake image and unsupported types', function (string $name, string $bytes) {
        uploadPhoto($this->browser, $this->car->id, TestImages::upload($name, $bytes))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'photo')->assertJsonPath('errors.0.code', 'invalid_file_type');
        expect(CarPhoto::query()->count())->toBe(0);
    })->with([
        ['foto.jpg', 'ini bukan gambar sama sekali'],
        ['foto.gif', (string) base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')],
        ['foto.svg', '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'],
    ]);

    it('rejects images larger than 6000 pixels', function () {
        uploadPhoto($this->browser, $this->car->id, TestImages::upload('lebar.png', TestImages::png(6001, 2)))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'photo');
    });

    it('rejects a sixth photo', function () {
        foreach (range(0, 4) as $order) {
            processedPhoto($this->car, $order);
        }

        uploadPhoto($this->browser, $this->car->id, TestImages::upload('a.jpg', TestImages::jpeg()))
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'photo')->assertJsonPath('errors.0.code', 'too_many');
        expect(CarPhoto::query()->where('car_id', $this->car->id)->count())->toBe(5);
    });

    it('hides cars of another branch', function () {
        $other = Car::factory()->create();

        uploadPhoto($this->browser, $other->id, TestImages::upload('a.jpg', TestImages::jpeg()))->assertNotFound();
    });

    it('requires an admin session', function () {
        uploadPhoto(new Browser($this), $this->car->id, TestImages::upload('a.jpg', TestImages::jpeg()))->assertUnauthorized();
    });
});

describe('detail', function () {
    it('lists photos in order with the main photo and URLs', function () {
        $second = processedPhoto($this->car, 1);
        $first = processedPhoto($this->car, 0);
        $first->forceFill(['variants' => ['480' => 'cars/x-480.webp', '960' => 'cars/x-960.webp', '1440' => 'cars/x-1440.webp']])->save();
        CarPhoto::factory()->create(['car_id' => $this->car->id, 'sort_order' => 2, 'processed_at' => null]);

        $photos = $this->browser->get("/api/v1/admin/cars/{$this->car->id}")->assertOk()->json('data.photos');

        expect(array_column($photos, 'id'))->toBe([$first->id, $second->id, $photos[2]['id']])
            ->and($photos[0]['is_main'])->toBeTrue()
            ->and($photos[0]['urls']['480'])->toEndWith('cars/x-480.webp')
            ->and($photos[2]['processing'])->toBeTrue()
            ->and($photos[2]['urls'])->toBeNull();
    });
});

describe('order', function () {
    it('stores a new order and audits it', function () {
        [$a, $b, $c] = [processedPhoto($this->car, 0), processedPhoto($this->car, 1), processedPhoto($this->car, 2)];

        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/photos/order", ['photo_ids' => [$c->id, $a->id, $b->id]])
            ->assertOk()->assertJsonPath('data.0.id', $c->id)->assertJsonPath('data.0.is_main', true);

        expect([$c->fresh()->sort_order, $a->fresh()->sort_order, $b->fresh()->sort_order])->toBe([0, 1, 2])
            ->and(DB::table('audit_logs')->where('action', 'admin.car.photos_reordered')->count())->toBe(1);
    });

    it('rejects incomplete, duplicate or foreign lists', function (string $case) {
        [$a, $b, $c] = [processedPhoto($this->car, 0), processedPhoto($this->car, 1), processedPhoto($this->car, 2)];
        $foreign = processedPhoto(Car::factory()->create(['branch_id' => $this->branch->id]), 0);
        $ids = match ($case) {
            'incomplete' => [$c->id, $a->id],
            'duplicate' => [$c->id, $a->id, $a->id],
            'foreign' => [$c->id, $a->id, $foreign->id],
        };

        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/photos/order", ['photo_ids' => $ids])
            ->assertUnprocessable();
        expect($a->fresh()->sort_order)->toBe(0);
    })->with(['incomplete', 'duplicate', 'foreign']);
});

describe('delete', function () {
    it('deletes the main photo, its files, and renumbers the rest', function () {
        Storage::disk('public')->put('cars/1/m-480.webp', 'x');
        Storage::disk('public')->put('cars/1/m-1440.webp', 'x');
        $main = CarPhoto::factory()->create(['car_id' => $this->car->id, 'sort_order' => 0, 'path' => 'cars/1/m-1440.webp', 'variants' => ['480' => 'cars/1/m-480.webp', '1440' => 'cars/1/m-1440.webp']]);
        $second = processedPhoto($this->car, 1);

        $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}/photos/{$main->id}")->assertOk();

        expect(CarPhoto::query()->find($main->id))->toBeNull()->and($second->fresh()->sort_order)->toBe(0);
        Storage::disk('public')->assertMissing(['cars/1/m-480.webp', 'cars/1/m-1440.webp']);
        expect(DB::table('audit_logs')->where('action', 'admin.car.photo_removed')->count())->toBe(1);
    });

    it('answers 404 for a photo of another car', function () {
        $other = processedPhoto(Car::factory()->create(['branch_id' => $this->branch->id]), 0);

        $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}/photos/{$other->id}")->assertNotFound();
        expect($other->fresh())->not->toBeNull();
    });
});
