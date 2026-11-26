<?php

use App\Models\Brand;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\AdminBrowsers;
use Tests\Support\Browser;
use Tests\TestCase;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
    $this->brand = Brand::factory()->create(['name' => 'Mazda', 'slug' => 'mazda']);
    $this->browser = AdminBrowsers::staff($this);
});

function uploadLogo(TestCase $test, Browser $browser, int $brandId, UploadedFile $file)
{
    return $browser->upload("/api/v1/admin/brands/{$brandId}/logo", ['logo' => $file]);
}

/**
 * A real uploaded file (MIME detected from the content, as in production), unlike
 * UploadedFile::fake(), whose MIME type is guessed from the file name.
 */
function realUpload(string $name, string $contents): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'logo');
    file_put_contents($path, $contents);

    return new UploadedFile($path, $name, null, null, true);
}

function pngBytes(int $padBytes = 0): string
{
    // A valid 1x1 PNG; trailing bytes after IEND keep it a PNG for finfo while growing its size.
    $png = (string) base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

    return $png.str_repeat('0', $padBytes);
}

function pngFile(string $name = 'logo.png', int $padBytes = 0): UploadedFile
{
    return realUpload($name, pngBytes($padBytes));
}

it('stores a PNG logo under a random name and exposes its URL', function () {
    $response = uploadLogo($this, $this->browser, $this->brand->id, pngFile())->assertOk();

    $path = $this->brand->fresh()->logo_path;
    expect($path)->toStartWith('brands/')->toEndWith('.png')->not->toContain('logo')
        ->and($response->json('data.logo_url'))->toContain($path);
    Storage::disk('public')->assertExists($path);
    expect(DB::table('audit_logs')->where('action', 'admin.brand.logo_updated')->count())->toBe(1);
});

it('sanitises SVG logos', function () {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" viewBox="0 0 10 10">'
        .'<script>alert(2)</script><a href="javascript:alert(3)"><rect width="10" height="10" fill="#000" onclick="x()"/></a>'
        .'<foreignObject><div>x</div></foreignObject><use href="https://evil.example/x.svg#a"/><use href="#local"/>'
        .'<circle r="2" style="fill:url(https://evil.example/p)"/></svg>';

    uploadLogo($this, $this->browser, $this->brand->id, realUpload('logo.svg', $svg))->assertOk();

    $stored = Storage::disk('public')->get($this->brand->fresh()->logo_path);
    expect($stored)->toContain('<svg')
        ->not->toContain('script')->not->toContain('onload')->not->toContain('onclick')
        ->not->toContain('javascript')->not->toContain('foreignObject')->not->toContain('evil.example')
        ->toContain('href="#local"');
});

it('rejects SVGs with a DOCTYPE or that are not SVG', function (string $content) {
    uploadLogo($this, $this->browser, $this->brand->id, realUpload('logo.svg', $content))
        ->assertUnprocessable()->assertJsonPath('errors.0.field', 'logo');
})->with([
    '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect',
]);

it('rejects files that are too large or not images', function () {
    uploadLogo($this, $this->browser, $this->brand->id, pngFile('big.png', 1024 * 1024))
        ->assertUnprocessable()->assertJsonPath('errors.0.code', 'file_too_large');

    uploadLogo($this, $this->browser, $this->brand->id, realUpload('logo.png', 'bukan gambar'))
        ->assertUnprocessable()->assertJsonPath('errors.0.code', 'invalid_file_type');
});

it('deletes the previous logo when replaced or removed', function () {
    uploadLogo($this, $this->browser, $this->brand->id, pngFile())->assertOk();
    $first = $this->brand->fresh()->logo_path;

    uploadLogo($this, $this->browser, $this->brand->id, pngFile('lain.png'))->assertOk();
    $second = $this->brand->fresh()->logo_path;
    Storage::disk('public')->assertMissing($first);

    $this->browser->json('DELETE', "/api/v1/admin/brands/{$this->brand->id}/logo")->assertOk()->assertJsonPath('data.logo_url', null);
    Storage::disk('public')->assertMissing($second);
});
