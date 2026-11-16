# RentACar — Backend (Laravel API)

REST API `/api/v1` untuk website pelanggan, admin panel, dan (v1.1) perangkat GPS.

## Stack

- PHP ≥ 8.3 (CI: 8.4), Laravel 13
- Laravel Sanctum 4 (SPA, cookie) — guard pelanggan dan admin ditambahkan di story autentikasi
- PostgreSQL ≥ 16 (lokal & CI: 18)
- Driver sesi, cache, dan antrean dari env: `database` (lokal & CI), `redis` opsional lewat `predis`
- Pest 4, Laravel Pint, Larastan (PHPStan level 6), Scramble (OpenAPI di `/docs/api`, hanya `local`)

## Struktur utama

```
app/
├── Http/Controllers/Api/V1/   Controller API berversi
├── Support/                   Infrastruktur (mis. Health/HealthChecker)
└── Providers/                 Termasuk proses `composer dev`
bootstrap/app.php              Routing, middleware (statefulApi, trustProxies), render JSON untuk /api/*
database/                      migrations, seeders, factories
routes/api.php                 /api/v1/...
tests/                         Pest (Feature, Unit)
```

## Menjalankan

```bash
composer install
cp .env.example .env        # isi DB_PASSWORD
php artisan key:generate
php artisan migrate
composer dev                # server 127.0.0.1:8000 + queue:listen + schedule:work
```

Frontend (`../frontend`, `npm run dev`) meneruskan `/api`, `/sanctum`, `/docs`, `/storage` ke server ini.

## Perintah

| Tujuan | Perintah |
|---|---|
| Tes | `php artisan test` |
| Format | `./vendor/bin/pint` (cek: `composer lint`) |
| Analisis statis | `composer analyse` |
| Migrasi | `php artisan migrate` |
| Dokumentasi API | `http://localhost:3000/docs/api` (lokal) |

> Tes hanya berjalan pada PostgreSQL dengan database berakhiran `_test` (`rentacar_test`). Perintah yang menghapus data (`migrate:fresh`, `db:wipe`, dll.) tidak dijalankan tanpa memastikan environment dan database tujuan.

## Format respons

Semua respons `/api/*` dibangun lewat `App\Support\ApiResponse`:

```json
{ "code": 200, "success": true, "message": "...", "data": {}, "errors": null, "meta": null }
```

- `code` = status HTTP. Gagal → `success: false`, `data: null`, `errors` = daftar `{ field, code, message, details? }`.
- Koleksi → `data` berisi daftar, `meta` = `{ page, per_page, total, total_pages }`.
- Semua exception di `/api/*` dirender oleh `App\Exceptions\ApiExceptionRenderer` dengan pesan aman berbahasa Indonesia (tanpa stack trace/SQL/path). `meta.debug` hanya muncul untuk error server saat `APP_DEBUG=true`.
- Kode error umum: `malformed_json` 400 · `unauthenticated` 401 · `forbidden` 403 · `not_found` 404 · `method_not_allowed` 405 · `conflict` 409 · `payload_too_large` 413 · `unsupported_media_type` 415 · `csrf_token_mismatch` 419 · validasi 422 (`required`, `invalid_format`, `too_short`, `too_long`, `out_of_range`, `not_unique`, `invalid_file_type`, `file_too_large`, `mismatch`, `invalid`, `unknown_filter`) · `rate_limited` 429 · `internal_error` 500 · `service_unavailable` 503.
- Exception domain bisa mengimplementasikan `App\Exceptions\ApiRenderable` untuk status/kode/details sendiri.

Contoh: `GET /api/v1/health` → 200 jika database dan cache sehat, 503 jika salah satunya gagal.

## Pelacakan, rate limit, dan penjaga permintaan

- **`X-Request-Id`** di setiap respons (UUID dari klien dipakai ulang, jika tidak valid dibuat baru) dan di konteks setiap log. Nilai sensitif (`password*`, `token`, `*_token`, `authorization`, `cookie`, nomor SIM) disamarkan `[REDACTED]` di log.
- **Rate limiter bernama** (pasang dengan `throttle:<nama>`): `public` 60/menit/IP · `auth` 5/menit/IP+email · `customer` 120/menit · `admin` 300/menit · `booking-create` dan `payment-upload` 10/jam · `telemetry` 60/menit/perangkat. Header `X-RateLimit-*`, dan `Retry-After` saat 429.
- **Penjaga `/api/*`:** body non-multipart > 256 KB → 413 (`limit_body:<bytes>` untuk batas lain), tipe konten selain JSON/multipart/form → 415, JSON rusak → 400, `Cache-Control: no-store` kecuali route memilih cache.

## Daftar (paginasi, sortir, cari, filter)

```php
$spec = new QuerySpec(
    audience: QuerySpec::AUDIENCE_PUBLIC,           // per_page 12/24/48 (admin: 10/25/50/100)
    sorts: ['name' => 'name', 'price' => 'daily_price'],
    defaultSort: 'name',                             // sort tidak dikenal → default
    searchColumns: ['name'],                         // q: 2–100 karakter, ILIKE dengan wildcard di-escape
    filters: ['status' => 'status'],                 // filter[...] tidak dikenal → 422 unknown_filter
);

$page = CollectionQuery::fromRequest($request, $spec)->paginate(Car::query());

return ApiResponse::paginated($page);
```

## Konfigurasi

Salin `.env.example` ke `.env`. Jangan commit `.env` atau nilai rahasia apa pun.
