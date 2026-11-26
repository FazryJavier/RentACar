<?php

use App\Domain\Media\ImageReencoder;
use App\Jobs\ProcessCarPhoto;
use App\Models\CarPhoto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Support\TestImages;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Storage::fake('public');
});

function unprocessedPhoto(string $bytes): CarPhoto
{
    $path = 'car-photos/originals/test.jpg';
    Storage::disk('local')->put($path, $bytes);

    return CarPhoto::factory()->create(['path' => $path, 'variants' => [], 'processed_at' => null]);
}

it('writes WebP variants of 480, 960 and 1440 px and deletes the original', function () {
    $photo = unprocessedPhoto(TestImages::jpeg(3000, 2000));

    (new ProcessCarPhoto($photo->id))->handle(new ImageReencoder);

    $photo->refresh();
    expect($photo->isProcessed())->toBeTrue()->and($photo->path)->toBe($photo->variants['1440']);
    foreach (['480' => 320, '960' => 640, '1440' => 960] as $width => $height) {
        $bytes = Storage::disk('public')->get($photo->variants[$width]);
        $size = getimagesizefromstring($bytes);
        expect($size['mime'])->toBe('image/webp')->and($size[0])->toBe((int) $width)->and($size[1])->toBe($height);
    }
    Storage::disk('local')->assertMissing('car-photos/originals/test.jpg');
});

it('never upscales small photos', function () {
    $photo = unprocessedPhoto(TestImages::jpeg(800, 600));

    (new ProcessCarPhoto($photo->id))->handle(new ImageReencoder);

    $photo->refresh();
    expect(getimagesizefromstring(Storage::disk('public')->get($photo->variants['1440']))[0])->toBe(800)
        ->and(getimagesizefromstring(Storage::disk('public')->get($photo->variants['960']))[0])->toBe(800)
        ->and(getimagesizefromstring(Storage::disk('public')->get($photo->variants['480']))[0])->toBe(480);
});

it('removes EXIF metadata including GPS', function () {
    $original = TestImages::jpeg(1000, 800, withExif: true);
    $tmp = tempnam(sys_get_temp_dir(), 'exif');
    file_put_contents($tmp, $original);
    expect(@exif_read_data($tmp)['Make'] ?? null)->toBe('TestCam');

    $photo = unprocessedPhoto($original);
    (new ProcessCarPhoto($photo->id))->handle(new ImageReencoder);

    foreach ($photo->refresh()->variants as $path) {
        $bytes = Storage::disk('public')->get($path);
        expect($bytes)->not->toContain('Exif')->not->toContain('TestCam')->not->toContain('XMP');
    }
});

it('removes the photo and its files when processing fails for good', function () {
    $photo = unprocessedPhoto('bukan gambar');
    $job = new ProcessCarPhoto($photo->id);

    expect(fn () => $job->handle(new ImageReencoder))->toThrow(Exception::class);
    $job->failed(new RuntimeException('decode failed'));

    expect(CarPhoto::query()->find($photo->id))->toBeNull()
        ->and(Storage::disk('public')->allFiles())->toBe([]);
    Storage::disk('local')->assertMissing('car-photos/originals/test.jpg');
});

it('does nothing for a deleted or already processed photo', function () {
    $processed = CarPhoto::factory()->create();

    (new ProcessCarPhoto($processed->id))->handle(new ImageReencoder);
    (new ProcessCarPhoto(999999))->handle(new ImageReencoder);

    expect(Storage::disk('public')->allFiles())->toBe([]);
});
