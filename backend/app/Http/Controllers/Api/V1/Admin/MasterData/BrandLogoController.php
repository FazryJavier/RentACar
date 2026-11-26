<?php

namespace App\Http\Controllers\Api\V1\Admin\MasterData;

use App\Domain\Admin\MasterData\MasterDataAudit;
use App\Http\Requests\Admin\MasterData\BrandLogoRequest;
use App\Http\Resources\BrandResource;
use App\Models\Brand;
use App\Support\ApiResponse;
use App\Support\Svg\SvgSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Brand logos on the public disk (`brands/`), random names; SVGs are sanitised before storage.
 */
final class BrandLogoController extends AdminController
{
    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/svg+xml' => 'svg',
    ];

    public function __construct(
        private readonly SvgSanitizer $sanitizer,
        private readonly MasterDataAudit $audit,
    ) {}

    public function store(BrandLogoRequest $request, Brand $brand): JsonResponse
    {
        $file = $request->file('logo');
        assert($file instanceof UploadedFile);
        $mime = (string) $file->getMimeType();
        $extension = self::EXTENSIONS[$mime] ?? throw ValidationException::withMessages(['logo' => 'Logo harus JPG, PNG, WebP, atau SVG']);

        $contents = $extension === 'svg'
            ? $this->sanitizer->sanitize((string) $file->get())
            : $file->get();

        if ($contents === null || $contents === false) {
            throw ValidationException::withMessages(['logo' => 'Logo SVG tidak valid']);
        }

        $path = 'brands/'.Str::uuid()->toString().'.'.$extension;
        Storage::disk('public')->put($path, $contents);
        $old = $brand->logo_path;

        DB::transaction(function () use ($brand, $path): void {
            $brand->forceFill(['logo_path' => $path, 'version' => $brand->version + 1])->save();
        });

        if ($old !== null) {
            Storage::disk('public')->delete($old);
        }

        $this->audit->record($request, $this->admin($request), 'brand', 'logo_updated', $brand);

        return ApiResponse::ok(BrandResource::make($brand->refresh())->resolve($request), 'Logo merek disimpan.');
    }

    public function destroy(Request $request, Brand $brand): JsonResponse
    {
        $old = $brand->logo_path;

        if ($old !== null) {
            $brand->forceFill(['logo_path' => null, 'version' => $brand->version + 1])->save();
            Storage::disk('public')->delete($old);
            $this->audit->record($request, $this->admin($request), 'brand', 'logo_removed', $brand);
        }

        return ApiResponse::ok(BrandResource::make($brand->refresh())->resolve($request), 'Logo merek dihapus.');
    }
}
