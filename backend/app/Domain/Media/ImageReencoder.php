<?php

namespace App\Domain\Media;

use Intervention\Image\ImageManager;

/**
 * Re-encodes untrusted images to WebP with GD. Re-encoding writes no EXIF/XMP/IPTC, so metadata
 * (for example GPS location from phone photos) is removed; images are only ever scaled down.
 */
final class ImageReencoder
{
    public const QUALITY = 80;

    /**
     * WebP versions at the given widths (largest first), decoding the image once.
     *
     * @param  list<int>  $widths  Descending widths, e.g. [1440, 960, 480].
     * @return array<int, string> Width => WebP bytes.
     */
    public function variants(string $bytes, array $widths): array
    {
        // A 6000 × 6000 px image needs ~150 MB as a GD bitmap.
        ini_set('memory_limit', '512M');

        $image = ImageManager::gd(autoOrientation: true, decodeAnimation: false)->read($bytes);
        $variants = [];
        foreach ($widths as $width) {
            $image->scaleDown(width: $width);
            $variants[$width] = (string) $image->toWebp(quality: self::QUALITY);
        }

        return $variants;
    }

    /** One WebP at most `$maxWidth` pixels wide. */
    public function webp(string $bytes, int $maxWidth): string
    {
        return $this->variants($bytes, [$maxWidth])[$maxWidth];
    }
}
