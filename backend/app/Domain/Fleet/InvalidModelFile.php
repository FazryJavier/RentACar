<?php

namespace App\Domain\Fleet;

use App\Exceptions\ApiRenderable;
use App\Exceptions\ErrorCatalog;
use App\Support\Http\ApiError;
use RuntimeException;

/** The uploaded file is not an acceptable binary glTF 2.0 model (422 on `file`). */
final class InvalidModelFile extends RuntimeException implements ApiRenderable
{
    public const NOT_GLB = 'Unggah file .glb (glTF 2.0) maksimal 15 MB';

    public const EXTERNAL_REFERENCE = 'File model tidak boleh merujuk file eksternal';

    public function apiStatus(): int
    {
        return 422;
    }

    public function apiMessage(): string
    {
        return ErrorCatalog::message(ErrorCatalog::VALIDATION_FAILED);
    }

    public function apiErrors(): array
    {
        return [new ApiError('file', 'invalid_file_type', $this->getMessage())];
    }
}
