<?php

use App\Models\Branch;
use App\Models\Car;
use App\Models\CarCondition;
use App\Models\CarModel3d;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\AdminBrowsers;
use Tests\Support\Browser;
use Tests\Support\TestGlb;
use Tests\Support\TestImages;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->branch = Branch::factory()->create();
    $this->car = Car::factory()->create(['branch_id' => $this->branch->id]);
    $this->browser = AdminBrowsers::staff($this, $admin, $this->branch);
});

function uploadModel(Browser $browser, int $carId, string $bytes, array $data = [])
{
    return $browser->upload("/api/v1/admin/cars/{$carId}/model", ['file' => TestGlb::upload($bytes)], [
        'source_name' => 'Studio Uji',
        'license' => 'CC-BY-4.0',
        ...$data,
    ]);
}

describe('upload', function () {
    it('stores a valid model with credit under a random name', function () {
        $response = uploadModel($this->browser, $this->car->id, TestGlb::bytes(), [
            'source_url' => 'https://example.com/model',
            'is_illustrative' => '1',
        ])->assertOk();

        $response->assertJsonPath('data.model_version', 1)
            ->assertJsonPath('data.license', 'CC-BY-4.0')
            ->assertJsonPath('data.is_illustrative', true)
            ->assertJsonPath('data.poster_url', null)
            ->assertJsonPath('data.camera', null);
        $model = CarModel3d::query()->where('car_id', $this->car->id)->firstOrFail();
        expect($model->file_path)->toStartWith("cars/{$this->car->id}/models/")->toEndWith('.glb')->not->toContain('model.glb')
            ->and($response->json('data.url'))->toBe('/storage/'.$model->file_path);
        Storage::disk('public')->assertExists($model->file_path);
        expect(DB::table('audit_logs')->where('action', 'admin.car.model_uploaded')->count())->toBe(1);
    });

    it('accepts exactly 15 MB and rejects one byte more', function () {
        uploadModel($this->browser, $this->car->id, TestGlb::bytes(padTo: 15_728_640))->assertOk();

        $tooBig = TestGlb::bytes(padTo: 15_728_640);
        $tooBig = substr($tooBig, 0, 8).pack('V', strlen($tooBig) + 4).substr($tooBig, 12)."\0\0\0\0";
        uploadModel($this->browser, $this->car->id, $tooBig)
            ->assertUnprocessable()->assertJsonPath('errors.0.field', 'file');
    });

    it('rejects files that are not binary glTF 2.0', function (string $bytes) {
        uploadModel($this->browser, $this->car->id, $bytes)
            ->assertUnprocessable()
            ->assertJsonPath('errors.0.field', 'file')
            ->assertJsonPath('errors.0.message', 'Unggah file .glb (glTF 2.0) maksimal 15 MB');
        expect(CarModel3d::query()->count())->toBe(0)->and(Storage::disk('public')->allFiles())->toBe([]);
    })->with([
        'wrong magic' => fn () => TestGlb::bytes(magic: 'gLTF'),
        'version 1' => fn () => TestGlb::bytes(version: 1),
        'length mismatch' => fn () => TestGlb::bytes(declaredLength: 999),
        'no JSON chunk' => fn () => TestGlb::bytes(jsonChunk: false),
        'asset version 1' => fn () => TestGlb::bytes(['asset' => ['version' => '1.0']]),
        'not a model' => fn () => str_repeat('x', 200),
    ]);

    it('rejects external references', function (array $json) {
        uploadModel($this->browser, $this->car->id, TestGlb::bytes($json))
            ->assertUnprocessable()
            ->assertJsonPath('errors.0.message', 'File model tidak boleh merujuk file eksternal');
    })->with([
        'external buffer' => [['buffers' => [['uri' => 'model.bin', 'byteLength' => 36]]]],
        'remote image' => [['images' => [['uri' => 'https://example.com/t.png']]]],
    ]);

    it('accepts embedded data URIs', function () {
        uploadModel($this->browser, $this->car->id, TestGlb::bytes(['images' => [['uri' => 'data:image/png;base64,iVBORw0KGgo=']]]))->assertOk();
    });

    it('requires source and licence', function (string $field) {
        uploadModel($this->browser, $this->car->id, TestGlb::bytes(), [$field => ''])
            ->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
    })->with(['source_name', 'license']);

    it('replaces the model, increments the version and deletes old files', function () {
        uploadModel($this->browser, $this->car->id, TestGlb::bytes())->assertOk();
        $old = CarModel3d::query()->firstOrFail();
        $this->browser->upload("/api/v1/admin/cars/{$this->car->id}/model/poster", ['poster' => TestImages::upload('p.png', TestImages::png(800, 500))])->assertOk();
        $oldPoster = $old->refresh()->poster_path;

        uploadModel($this->browser, $this->car->id, TestGlb::bytes(['asset' => ['generator' => 'v2']]))
            ->assertOk()->assertJsonPath('data.model_version', 2)->assertJsonPath('data.poster_url', null);

        Storage::disk('public')->assertMissing([$old->file_path, $oldPoster]);
        $log = DB::table('audit_logs')->where('action', 'admin.car.model_uploaded')->latest('id')->first();
        expect(json_decode($log->changes, true))->toBe(['model_version' => [1, 2]]);
    });

    it('hides other branches and requires a session', function () {
        $other = Car::factory()->create();

        uploadModel($this->browser, $other->id, TestGlb::bytes())->assertNotFound();
        uploadModel(new Browser($this), $this->car->id, TestGlb::bytes())->assertUnauthorized();
        expect(CarModel3d::query()->count())->toBe(0);
    });
});

describe('update, poster and delete', function () {
    beforeEach(function () {
        uploadModel($this->browser, $this->car->id, TestGlb::bytes())->assertOk();
    });

    it('saves the camera and flags', function () {
        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/model", [
            'camera' => ['position' => [2.5, 1.2, 3], 'target' => [0, 0.5, 0]],
            'is_illustrative' => true,
            'license' => 'CC0-1.0',
        ])->assertOk()
            ->assertJsonPath('data.camera.position', [2.5, 1.2, 3])
            ->assertJsonPath('data.camera.target', [0, 0.5, 0])
            ->assertJsonPath('data.is_illustrative', true)
            ->assertJsonPath('data.license', 'CC0-1.0');
        expect(DB::table('audit_logs')->where('action', 'admin.car.model_updated')->count())->toBe(1);
    });

    it('validates the camera', function (array $camera, string $field) {
        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/model", ['camera' => $camera])
            ->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
    })->with([
        [['position' => [1, 2], 'target' => [0, 0, 0]], 'camera.position'],
        [['position' => [1, 'a', 3], 'target' => [0, 0, 0]], 'camera.position.1'],
        [['position' => [1, 2, 3], 'target' => [0, 0, 1001]], 'camera.target.2'],
    ]);

    it('stores the poster as WebP without metadata and replaces the old one', function () {
        $first = $this->browser->upload("/api/v1/admin/cars/{$this->car->id}/model/poster", ['poster' => TestImages::upload('p.jpg', TestImages::jpeg(2400, 1500, withExif: true))])->assertOk();
        $path = CarModel3d::query()->firstOrFail()->poster_path;
        $bytes = Storage::disk('public')->get($path);
        expect(getimagesizefromstring($bytes)['mime'])->toBe('image/webp')
            ->and(getimagesizefromstring($bytes)[0])->toBe(1600)
            ->and($bytes)->not->toContain('TestCam')
            ->and($first->json('data.poster_url'))->toEndWith($path);

        $this->browser->upload("/api/v1/admin/cars/{$this->car->id}/model/poster", ['poster' => TestImages::upload('p.png', TestImages::png())])->assertOk();
        Storage::disk('public')->assertMissing($path);
    });

    it('deletes the model and flags positioned markers', function () {
        $model = CarModel3d::query()->firstOrFail();
        CarCondition::factory()->count(2)->create(['car_id' => $this->car->id, 'position' => [0, 1, 0], 'normal' => [0, 1, 0], 'model_version' => 1]);

        $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}/model")->assertOk();

        Storage::disk('public')->assertMissing($model->file_path);
        $this->browser->get("/api/v1/admin/cars/{$this->car->id}")->assertJsonPath('data.model_3d', null);
        expect($this->browser->get("/api/v1/admin/cars/{$this->car->id}/conditions")->json('data.*.needs_reposition'))->toBe([true, true]);
        expect(DB::table('audit_logs')->where('action', 'admin.car.model_removed')->count())->toBe(1);
    });

    it('answers 404 without a model', function () {
        $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}/model")->assertOk();

        $this->browser->json('PATCH', "/api/v1/admin/cars/{$this->car->id}/model", ['license' => 'MIT'])->assertNotFound();
        $this->browser->json('DELETE', "/api/v1/admin/cars/{$this->car->id}/model")->assertNotFound();
    });

    it('is part of the car detail', function () {
        $this->browser->get("/api/v1/admin/cars/{$this->car->id}")
            ->assertJsonPath('data.has_3d', true)
            ->assertJsonPath('data.model_3d.model_version', 1)
            ->assertJsonPath('data.last_inspected_at', null);
    });
});
