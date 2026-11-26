<?php

namespace App\Domain\Fleet;

use JsonException;

/**
 * Structural check of a binary glTF (GLB) file without loading it: 12-byte header (magic
 * "glTF", version 2, total length), first chunk = JSON (size-capped), `asset.version` 2.x, and
 * no external references (`buffers[].uri` / `images[].uri` must be absent or `data:` URIs).
 *
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#binary-gltf-layout
 */
final class GlbValidator
{
    public const MAX_BYTES = 15_728_640;

    public const MAX_JSON_BYTES = 4 * 1024 * 1024;

    private const MAGIC = 'glTF';

    private const CHUNK_JSON = 0x4E4F534A;

    /**
     * @throws InvalidModelFile
     */
    public function validate(string $path): void
    {
        $size = filesize($path);
        $handle = fopen($path, 'rb');
        if ($size === false || $handle === false || $size > self::MAX_BYTES || $size < 20) {
            throw new InvalidModelFile(InvalidModelFile::NOT_GLB);
        }

        try {
            $header = fread($handle, 20);
            if ($header === false || strlen($header) < 20) {
                throw new InvalidModelFile(InvalidModelFile::NOT_GLB);
            }

            /** @var array{1: int, 2: int, 3: int, 4: int} $fields */
            $fields = unpack('V4', substr($header, 4, 16));
            [$version, $length, $chunkLength, $chunkType] = [$fields[1], $fields[2], $fields[3], $fields[4]];

            if (substr($header, 0, 4) !== self::MAGIC || $version !== 2 || $length !== $size
                || $chunkType !== self::CHUNK_JSON || $chunkLength < 2 || $chunkLength > self::MAX_JSON_BYTES
                || 20 + $chunkLength > $size) {
                throw new InvalidModelFile(InvalidModelFile::NOT_GLB);
            }

            $json = fread($handle, $chunkLength);
        } finally {
            fclose($handle);
        }

        try {
            $document = json_decode((string) $json, true, 64, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidModelFile(InvalidModelFile::NOT_GLB);
        }

        if (! is_array($document) || ! is_array($document['asset'] ?? null)
            || ! is_string($document['asset']['version'] ?? null) || ! str_starts_with($document['asset']['version'], '2.')) {
            throw new InvalidModelFile(InvalidModelFile::NOT_GLB);
        }

        foreach (['buffers', 'images'] as $key) {
            foreach ((array) ($document[$key] ?? []) as $item) {
                $uri = is_array($item) ? ($item['uri'] ?? null) : null;
                if ($uri !== null && (! is_string($uri) || ! str_starts_with($uri, 'data:'))) {
                    throw new InvalidModelFile(InvalidModelFile::EXTERNAL_REFERENCE);
                }
            }
        }
    }
}
