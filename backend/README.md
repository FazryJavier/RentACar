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

## Skema database

Tabel v1.0 (migrasi di `database/migrations`): `branches`, `brands`, `categories`, `admins`, `customers`, `cars`, `car_photos`, `car_models_3d`, `car_conditions` (+ foto), `car_inspections`, `bookings`, `booking_status_histories`, `payments`, `idempotency_keys`, `settings`, `audit_logs`, `events`, `testimonials`.

Aturan yang dijaga **database**, bukan hanya kode:

- **Tidak ada pemesanan ganda:** exclusion constraint `bookings_no_overlap` (ekstensi `btree_gist`) menolak rentang `[pickup_at, blocked_until)` yang tumpang tindih untuk mobil yang sama selama statusnya menahan jadwal (`pending_payment`, `pending_verification`, `confirmed`, `ongoing`) → SQLSTATE `23P01` → API 409.
- **Keunikan:** plat nomor unik di antara mobil yang belum dihapus; email pelanggan/admin dan nama merek/kategori unik tanpa peka huruf besar/kecil; satu pembayaran `pending` per pemesanan.
- **CHECK:** daftar nilai enum (dibuat dari enum PHP di `app/Enums`), rentang harga/tahun/kursi, Staf wajib punya cabang dan Super Admin tidak, total pemesanan = hari × harga + deposit.

Uang disimpan `bigint` Rupiah, waktu `timestamptz` (UTC).

## Autentikasi pelanggan

Sanctum SPA (cookie sesi + CSRF) di origin yang sama dengan frontend. Guard `web` (tabel `customers`), password broker `customers` (tabel `customer_password_reset_tokens`, token 60 menit, sekali pakai).

| Endpoint (`/api/v1`) | Keterangan |
|---|---|
| `POST /auth/register` | Daftar + langsung masuk (201). Email disimpan huruf kecil, No. HP sebagai `62…` |
| `POST /auth/login` | Masuk; pesan gagal selalu "Email atau kata sandi salah."; 5 kegagalan/menit per IP + email → 429 + `Retry-After`; akun diblokir → 403 `account_blocked` |
| `POST /auth/logout` | Keluar (sesi dihapus di server) |
| `POST /auth/forgot-password` | Respons selalu sama; email berisi tautan ke `{FRONTEND_URL}/atur-ulang-kata-sandi` |
| `POST /auth/reset-password` | Token tidak valid/kedaluwarsa → 422 pada `token` |
| `GET` / `PATCH /me`, `PUT /me/password` | Profil sendiri; ubah kata sandi wajib kata sandi lama |

- Rute pelanggan memakai `auth:web` + `AuthenticateSession` (Sanctum): setelah kata sandi diubah atau diatur ulang, sesi lain keluar otomatis pada permintaan berikutnya.
- Login gagal, login akun diblokir, atur ulang dan ubah kata sandi dicatat di `audit_logs` (tanpa kata sandi).
- Lokal `MAIL_MAILER=log`: tautan atur ulang ada di `storage/logs/laravel.log`.
- Koneksi PostgreSQL memakai zona waktu sesi `UTC` (`config/database.php`), sehingga `timestamptz` selalu benar apa pun zona waktu server.

## Admin panel: autentikasi, peran, cakupan cabang

Guard `admin` (tabel `admins`) terpisah dari guard pelanggan `web`; password broker `admins`. Aturan login, batas percobaan, atur ulang, dan ubah kata sandi sama dengan pelanggan. Admin nonaktif → 403 `account_blocked`; admin terhapus → 401.

| Endpoint (`/api/v1/admin`) | Keterangan |
|---|---|
| `POST /auth/login`, `POST /auth/logout` | Masuk/keluar admin |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | Tautan ke `{FRONTEND_URL}/admin/atur-ulang-kata-sandi` |
| `GET /me` | `id`, `name`, `email`, `role`, `branch` (`{id,name}` untuk Staf), `menu` (kunci menu sesuai peran), `created_at` |
| `PUT /me/password` | Ubah kata sandi (wajib kata sandi lama) |

- **Peran:** batasi route khusus Super Admin dengan middleware `admin.role:super_admin` (Staf → 403 `forbidden`).
- **Cakupan cabang:** model `Car` dan `Booking` memakai `BranchScoped`. Modul admin wajib memuat data lewat `Model::visibleTo($admin)` dan `Model::findVisibleOrFail($id, $admin)`: Staf hanya melihat cabangnya; data cabang lain → 404 yang sama dengan ID yang tidak ada. Scope ini eksplisit (bukan global) agar query publik tidak ikut terfilter.
- **Menu:** `App\Enums\AdminMenu` menentukan menu per peran; UI hanya menyembunyikan, server tetap memeriksa.
- Pelanggan dan admin bisa masuk bersamaan di satu browser (guard berbeda, satu cookie sesi).

## Admin panel: data master (merek, kategori, cabang)

| Endpoint (`/api/v1/admin`) | Akses | Keterangan |
|---|---|---|
| `GET /brands`, `GET /brands/{id}` | Semua admin | Daftar (`q`, `sort` = `name`/`updated_at`, `page`, `per_page`) dan detail |
| `POST /brands`, `PATCH /brands/{id}`, `DELETE /brands/{id}` | Semua admin | Nama unik tanpa membedakan huruf besar/kecil; slug dibuat otomatis |
| `POST /brands/{id}/logo`, `DELETE /brands/{id}/logo` | Semua admin | `multipart/form-data` field `logo`: JPG/PNG/WebP/SVG ≤ 1 MB (tipe dicek dari isi file) |
| `GET /categories`, `GET /categories/{id}` | Semua admin | `sort` = `sort_order`/`name`; urutan nama sebagai pemecah seri |
| `POST /categories`, `PATCH /categories/{id}`, `DELETE /categories/{id}` | Semua admin | `name`, `description` (opsional), `sort_order` 0–999 |
| `GET /branches`, `GET /branches/{id}` | Semua admin | Filter `filter[is_active]`, `filter[city]` |
| `POST /branches`, `PATCH /branches/{id}`, `DELETE /branches/{id}` | Super Admin | Jam `HH:mm` (tutup setelah buka), telepon 8–15 digit (disimpan `62…`/`0…` tanpa spasi), koordinat |

- **Kunci optimistis:** setiap respons berisi `version`. `PATCH` wajib mengirim `version` terakhir; bila data sudah diubah admin lain → 409 `version_conflict` (field `version`). Muat ulang lalu kirim lagi.
- **Data yang masih dipakai:** `DELETE` → 409 `resource_in_use` dengan `errors[0].details.usage` (mis. `{"cars": 3}`) dan pesan seperti "Merek masih dipakai 3 mobil."
- **Logo:** disimpan di disk `public` dengan nama acak (`brands/<uuid>.<ext>`); file lama dihapus saat diganti/dihapus. SVG dibersihkan dengan allowlist elemen/atribut (`App\Support\Svg\SvgSanitizer`: tanpa skrip, event handler, `foreignObject`, DOCTYPE/entity, atau URL eksternal). Jalankan `php artisan storage:link` sekali agar `/storage/...` bisa diakses. URL file publik relatif (`/storage/...`, lewat proxy frontend); isi `PUBLIC_STORAGE_URL` bila perlu URL absolut (mis. CDN).
- Semua perubahan dicatat di `audit_logs` (`admin.brand.created`, `admin.branch.updated`, `admin.brand.logo_updated`, …) beserta kolom yang berubah.

## Admin panel: armada (mobil & foto)

| Endpoint (`/api/v1/admin`) | Keterangan |
|---|---|
| `GET /cars` | Daftar: `q` (model, plat, merek), `sort` = `model_name`/`year`/`daily_price`/`created_at` (default `-created_at`), filter `status`, `category_id`, `brand_id`, `branch_id` (Super Admin saja). Item berisi `thumbnail_url`, `photos_count`, `has_3d` |
| `GET /cars/{id}` | Detail + `photos` (`urls` per lebar 480/960/1440 atau `null` selama diproses) + `version` |
| `POST /cars`, `PATCH /cars/{id}`, `DELETE /cars/{id}` | Tambah, ubah (wajib `version`), hapus (*soft delete*) |
| `POST /cars/{id}/photos` | `multipart/form-data` field `photo` (+ `alt_text` opsional): JPG/PNG/WebP ≤ 2 MB, maksimal 6000 × 6000 px, maksimal 5 foto per mobil |
| `PATCH /cars/{id}/photos/order` | `{"photo_ids": [...]}` berisi semua foto mobil dalam urutan baru; foto pertama = foto utama |
| `DELETE /cars/{id}/photos/{photoId}` | Hapus foto + filenya; urutan sisa dirapikan |

- **Akses:** Super Admin dan Staf. Staf hanya melihat/mengubah mobil cabangnya (cabang lain → 404) dan mobil baru selalu masuk cabangnya (`branch_id` dari Staf diabaikan).
- **Validasi:** tahun 2000 s.d. tahun berjalan (WIB) + 1, kursi 2–16, harga per hari Rp100.000–Rp10.000.000, deposit Rp0–Rp10.000.000, maksimal 12 fasilitas. Plat dinormalisasi (`b1234xyz` → `B 1234 XYZ`) dan unik di antara mobil yang belum dihapus.
- **Slug** dibuat sekali saat tambah (`merek-model-tahun-warna`, akhiran `-2` bila sudah dipakai) dan tidak berubah saat mobil diubah.
- **Pemesanan aktif:** ubah status ke `maintenance`/`inactive`, pindah cabang, atau hapus mobil yang masih punya pemesanan penahan jadwal → 409 `car_has_active_bookings` dengan `errors[0].details.bookings` (`code`, `status`, `pickup_at`). Untuk perubahan status, kirim ulang dengan `force_cancel_bookings: true` + `cancel_reason` (5–300 karakter) untuk membatalkan pemesanan tersebut (riwayat status + audit); sewa yang sedang berjalan tidak pernah dibatalkan.
- **Foto:** file asli disimpan privat, lalu job antrean `ProcessCarPhoto` (Intervention Image 3, GD) membuat varian WebP 480/960/1440 px (tanpa memperbesar), membuang metadata (termasuk lokasi GPS), lalu menghapus file asli. Butuh worker antrean (`composer dev` sudah menjalankannya); tanpa worker foto tetap "diproses". `upload_max_filesize`/`post_max_size` PHP minimal 2 MB.
- Audit: `admin.car.created|updated|deleted|photo_added|photo_removed|photos_reordered`, dan `admin.booking.cancelled` untuk pemesanan yang dibatalkan.

## Seeding

```bash
php artisan db:seed     # aman diulang: hanya menambah yang belum ada, tidak pernah menghapus
```

- `SettingsSeeder` — pengaturan default (tidak menimpa nilai yang sudah diubah).
- `ReferenceSeeder` — kategori dan merek umum (berdasarkan `slug`).
- `SuperAdminSeeder` — Super Admin pertama dari `SEED_SUPERADMIN_EMAIL` dan `SEED_SUPERADMIN_PASSWORD` di `.env` (gagal jika kosong; password tidak pernah ditampilkan).

## Konfigurasi

Salin `.env.example` ke `.env`. Jangan commit `.env` atau nilai rahasia apa pun.
