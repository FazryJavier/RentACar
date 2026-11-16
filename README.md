# RentACar

> **Proyek demo / portofolio.** Semua transaksi, pembayaran, data mobil, cabang, dan pelanggan adalah **simulasi**. Jangan mentransfer uang sungguhan.

Aplikasi web penyewaan mobil dengan:

- **Website pelanggan** — company profile, katalog armada, detail mobil dengan **tampilan 3D interaktif** dan penanda kondisi, pencarian ketersediaan, pemesanan, dan unggah bukti bayar (simulasi).
- **Admin panel** — CRUD armada, cabang, pelanggan, verifikasi pembayaran, alur status sewa, editor penanda kondisi 3D, dan (v1.1) **peta armada GPS** langsung.
- **REST API** — `/api/v1` dengan format respons seragam `{code, success, message, data, errors, meta}`.

## Stack

| Bagian | Teknologi |
|---|---|
| [`backend/`](backend/README.md) | PHP, Laravel 13, Sanctum, PostgreSQL, Pest |
| [`frontend/`](frontend/README.md) | TypeScript, Next.js 16 (App Router), React 19, Tailwind CSS 4, Vitest, Playwright |
| CI | GitHub Actions (PostgreSQL 18 service) |

## Struktur

```
.
├── backend/              Laravel REST API
├── frontend/             Next.js: website pelanggan + /admin
└── .github/              CI & Dependabot
```

## Menjalankan secara lokal

Pengembangan berjalan **native, tanpa Docker**.

**Prasyarat:** PHP ≥ 8.3 dengan ekstensi `pdo_pgsql`, Composer 2, PostgreSQL ≥ 16, Node.js 24 + npm.

1. Buat role dan database PostgreSQL (sekali), misalnya role `rentacar` dengan database `rentacar` dan `rentacar_test`.
2. `cd backend && composer install`
3. Salin `backend/.env.example` → `backend/.env`, isi `DB_PASSWORD`, lalu `php artisan key:generate`.
4. `php artisan migrate`
5. `cd ../frontend && npm ci`
6. Salin `frontend/.env.example` → `frontend/.env.local`.
7. Terminal 1: `cd backend && composer dev` (Laravel di `127.0.0.1:8000` + antrean + penjadwal).
8. Terminal 2: `cd frontend && npm run dev`.
9. Buka `http://localhost:3000`. API tersedia di origin yang sama: `http://localhost:3000/api/v1/health`.

Next.js meneruskan `/api`, `/sanctum`, `/docs`, dan `/storage` ke Laravel, sehingga browser hanya berbicara dengan satu origin.

## Pengujian

| Bagian | Perintah |
|---|---|
| Backend | `cd backend && php artisan test` · `composer lint` · `composer analyse` |
| Frontend | `cd frontend && npm run lint && npm run typecheck && npm test && npm run build` |
| E2E | `cd frontend && npx playwright install chromium && npm run test:e2e` (kedua server berjalan) |

Tes backend selalu memakai PostgreSQL dengan database berakhiran `_test` dan menolak berjalan di database lain.

## Status

Dalam pengembangan — rilis v1.0 (MVP) belum selesai.

## Lisensi

[MIT](LICENSE)
