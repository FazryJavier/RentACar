<?php

namespace Tests\Support;

use Illuminate\Http\UploadedFile;

/**
 * Real image bytes for upload tests (built with GD), optionally with an EXIF block containing
 * a camera make and GPS data, so metadata stripping can be checked.
 */
final class TestImages
{
    public static function jpeg(int $width = 64, int $height = 48, bool $withExif = false): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefilledrectangle($image, 0, 0, $width - 1, $height - 1, (int) imagecolorallocate($image, 30, 60, 120));
        ob_start();
        imagejpeg($image, null, 80);
        $jpeg = (string) ob_get_clean();

        return $withExif ? substr($jpeg, 0, 2).self::exifSegment().substr($jpeg, 2) : $jpeg;
    }

    public static function png(int $width = 64, int $height = 48): string
    {
        $image = imagecreatetruecolor($width, $height);
        ob_start();
        imagepng($image);

        return (string) ob_get_clean();
    }

    public static function webp(int $width = 64, int $height = 48): string
    {
        $image = imagecreatetruecolor($width, $height);
        ob_start();
        imagewebp($image);

        return (string) ob_get_clean();
    }

    /** Pads image bytes with trailing zeros (ignored by decoders) to an exact size. */
    public static function padTo(string $bytes, int $size): string
    {
        return $bytes.str_repeat("\0", max(0, $size - strlen($bytes)));
    }

    /** A real uploaded file whose MIME type is detected from its content. */
    public static function upload(string $name, string $contents): UploadedFile
    {
        $path = (string) tempnam(sys_get_temp_dir(), 'img');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, null, true);
    }

    /**
     * APP1 Exif segment: IFD0 with Make "TestCam" and a GPS IFD with GPSLatitudeRef "S".
     */
    private static function exifSegment(): string
    {
        $tiff = 'II'.pack('v', 0x2A).pack('V', 8);
        // IFD0 at offset 8: 2 entries, next IFD 0. Make data at 38, GPS IFD at 46.
        $tiff .= pack('v', 2);
        $tiff .= pack('vvVV', 0x010F, 2, 8, 38);
        $tiff .= pack('vvVV', 0x8825, 4, 1, 46);
        $tiff .= pack('V', 0);
        $tiff .= "TestCam\0";
        // GPS IFD: GPSLatitudeRef "S" stored inline.
        $tiff .= pack('v', 1);
        $tiff .= pack('vvV', 0x0001, 2, 2)."S\0\0\0";
        $tiff .= pack('V', 0);

        $payload = "Exif\0\0".$tiff;

        return "\xFF\xE1".pack('n', strlen($payload) + 2).$payload;
    }
}
