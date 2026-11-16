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

```json
{ "code": 200, "success": true, "message": "...", "data": {}, "errors": null, "meta": null }
```

Contoh: `GET /api/v1/health` → 200 jika database dan cache sehat, 503 jika salah satunya gagal.

## Konfigurasi

Salin `.env.example` ke `.env`. Jangan commit `.env` atau nilai rahasia apa pun.
