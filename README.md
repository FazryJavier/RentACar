# RentACar

> **Proyek demo / portofolio.** Semua transaksi, pembayaran, data mobil, cabang, dan pelanggan adalah **simulasi**. Jangan mentransfer uang sungguhan.

Aplikasi web penyewaan mobil dengan:

- **Website pelanggan** — company profile, katalog armada, detail mobil dengan **tampilan 3D interaktif** dan penanda kondisi, pencarian ketersediaan, pemesanan, dan unggah bukti bayar (simulasi).
- **Admin panel** — CRUD armada, cabang, pelanggan, verifikasi pembayaran, alur status sewa, editor penanda kondisi 3D, dan (v1.1) **peta armada GPS** langsung.
- **REST API** — `/api/v1` dengan format respons seragam.

## Stack

| Bagian | Teknologi |
|---|---|
| [`backend/`](backend/README.md) | PHP, Laravel, Sanctum, PostgreSQL, Redis, Reverb (v1.1), Pest |
| [`frontend/`](frontend/README.md) | TypeScript, Next.js (App Router), React, Tailwind CSS, React Three Fiber, Leaflet, Vitest, Playwright |
| Infrastruktur | Docker Compose, Caddy, GitHub Actions |

## Struktur

```
.
├── backend/              Laravel REST API
├── frontend/             Next.js: website pelanggan + /admin
├── docker/               Dockerfile, Caddyfile, nginx.conf
├── docker-compose.yml    Layanan pengembangan
└── .github/workflows/    CI
```

## Menjalankan secara lokal

> Langkah lengkap ditambahkan saat fondasi proyek selesai dibuat.

1. Salin `backend/.env.example` → `backend/.env` dan `frontend/.env.example` → `frontend/.env.local`, lalu isi nilainya.
2. `docker compose up -d`
3. `docker compose exec php php artisan key:generate`
4. `docker compose exec php php artisan migrate --seed` (database kosong saja)
5. Buka `http://localhost`

## Status

Dalam pengembangan — rilis v1.0 (MVP) belum selesai.

## Lisensi

Belum ditentukan.
