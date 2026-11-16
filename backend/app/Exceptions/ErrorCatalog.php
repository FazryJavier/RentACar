<?php

namespace App\Exceptions;

/**
 * Stable error codes and safe, human-readable (Indonesian) messages for the API.
 * Mirrors Spesifikasi API §3. Messages never contain internal details.
 */
final class ErrorCatalog
{
    public const BAD_REQUEST = 'bad_request';

    public const MALFORMED_JSON = 'malformed_json';

    public const UNAUTHENTICATED = 'unauthenticated';

    public const FORBIDDEN = 'forbidden';

    public const NOT_FOUND = 'not_found';

    public const METHOD_NOT_ALLOWED = 'method_not_allowed';

    public const CONFLICT = 'conflict';

    public const PAYLOAD_TOO_LARGE = 'payload_too_large';

    public const UNSUPPORTED_MEDIA_TYPE = 'unsupported_media_type';

    public const CSRF_TOKEN_MISMATCH = 'csrf_token_mismatch';

    public const VALIDATION_FAILED = 'validation_failed';

    public const RATE_LIMITED = 'rate_limited';

    public const INTERNAL_ERROR = 'internal_error';

    public const SERVICE_UNAVAILABLE = 'service_unavailable';

    public const HTTP_ERROR = 'http_error';

    /** @var array<string, string> */
    private const MESSAGES = [
        self::BAD_REQUEST => 'Permintaan tidak valid.',
        self::MALFORMED_JSON => 'Format JSON pada permintaan tidak valid.',
        self::UNAUTHENTICATED => 'Silakan masuk terlebih dahulu.',
        self::FORBIDDEN => 'Anda tidak memiliki akses untuk tindakan ini.',
        self::NOT_FOUND => 'Data atau alamat yang diminta tidak ditemukan.',
        self::METHOD_NOT_ALLOWED => 'Metode HTTP tidak diizinkan untuk alamat ini.',
        self::CONFLICT => 'Permintaan bertentangan dengan kondisi data saat ini.',
        self::PAYLOAD_TOO_LARGE => 'Ukuran data yang dikirim terlalu besar.',
        self::UNSUPPORTED_MEDIA_TYPE => 'Tipe konten permintaan tidak didukung.',
        self::CSRF_TOKEN_MISMATCH => 'Sesi keamanan kedaluwarsa. Muat ulang halaman lalu coba lagi.',
        self::VALIDATION_FAILED => 'Data yang dikirim tidak valid.',
        self::RATE_LIMITED => 'Terlalu banyak permintaan. Coba lagi nanti.',
        self::INTERNAL_ERROR => 'Terjadi kesalahan pada server.',
        self::SERVICE_UNAVAILABLE => 'Layanan sedang tidak tersedia.',
        self::HTTP_ERROR => 'Permintaan tidak dapat diproses.',
    ];

    /** @var array<int, string> */
    private const STATUS_CODES = [
        400 => self::BAD_REQUEST,
        401 => self::UNAUTHENTICATED,
        403 => self::FORBIDDEN,
        404 => self::NOT_FOUND,
        405 => self::METHOD_NOT_ALLOWED,
        409 => self::CONFLICT,
        413 => self::PAYLOAD_TOO_LARGE,
        415 => self::UNSUPPORTED_MEDIA_TYPE,
        419 => self::CSRF_TOKEN_MISMATCH,
        422 => self::VALIDATION_FAILED,
        429 => self::RATE_LIMITED,
        500 => self::INTERNAL_ERROR,
        503 => self::SERVICE_UNAVAILABLE,
    ];

    public static function message(string $code): string
    {
        return self::MESSAGES[$code] ?? self::MESSAGES[self::HTTP_ERROR];
    }

    public static function codeForStatus(int $status): string
    {
        return self::STATUS_CODES[$status] ?? ($status >= 500 ? self::INTERNAL_ERROR : self::HTTP_ERROR);
    }
}
