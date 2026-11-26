<?php

namespace Tests\Support;

use Illuminate\Http\UploadedFile;

/**
 * Builds binary glTF (GLB) files for tests: a valid one-triangle model by default, with
 * options to break the header or add external references.
 */
final class TestGlb
{
    /**
     * @param  array<string, mixed>  $json  Overrides merged into the glTF JSON.
     */
    public static function bytes(array $json = [], int $version = 2, string $magic = 'glTF', ?int $declaredLength = null, int $padTo = 0, bool $jsonChunk = true): string
    {
        // One triangle: 3 vertices (float32 x 3).
        $positions = pack('g9', 0, 0, 0, 1, 0, 0, 0, 1, 0);
        $document = array_replace_recursive([
            'asset' => ['version' => '2.0', 'generator' => 'RentACar tests'],
            'scene' => 0,
            'scenes' => [['nodes' => [0]]],
            'nodes' => [['mesh' => 0]],
            'meshes' => [['primitives' => [['attributes' => ['POSITION' => 0]]]]],
            'buffers' => [['byteLength' => strlen($positions)]],
            'bufferViews' => [['buffer' => 0, 'byteOffset' => 0, 'byteLength' => strlen($positions)]],
            'accessors' => [[
                'bufferView' => 0, 'componentType' => 5126, 'count' => 3, 'type' => 'VEC3',
                'min' => [0, 0, 0], 'max' => [1, 1, 0],
            ]],
        ], $json);

        $jsonText = (string) json_encode($document, JSON_UNESCAPED_SLASHES);
        $jsonText .= str_repeat(' ', (4 - strlen($jsonText) % 4) % 4);
        $bin = $positions.str_repeat("\0", (4 - strlen($positions) % 4) % 4);

        $chunks = $jsonChunk
            ? pack('V', strlen($jsonText)).pack('V', 0x4E4F534A).$jsonText.pack('V', strlen($bin)).pack('V', 0x004E4942).$bin
            : pack('V', strlen($bin)).pack('V', 0x004E4942).$bin;

        // Padding goes inside the BIN chunk (still a valid GLB) when an exact size is requested.
        if ($padTo > 0) {
            $extra = $padTo - (12 + strlen($chunks));
            $extra -= $extra % 4;
            $bin .= str_repeat("\0", max(0, $extra));
            $chunks = pack('V', strlen($jsonText)).pack('V', 0x4E4F534A).$jsonText.pack('V', strlen($bin)).pack('V', 0x004E4942).$bin;
        }

        $length = 12 + strlen($chunks);

        return $magic.pack('V', $version).pack('V', $declaredLength ?? $length).$chunks;
    }

    public static function upload(string $bytes, string $name = 'model.glb'): UploadedFile
    {
        return TestImages::upload($name, $bytes);
    }
}
