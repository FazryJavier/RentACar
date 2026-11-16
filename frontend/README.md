# RentACar — Frontend (Next.js)

Website pelanggan (company profile, katalog, detail 3D, pemesanan) dan admin panel (`/admin`) dalam satu aplikasi Next.js.

## Stack

- Node.js 24, TypeScript (strict), Next.js 16 (App Router), React 19
- Tailwind CSS 4 (token design system ditambahkan berikutnya)
- Vitest + Testing Library, Playwright
- Rencana: Radix UI, React Three Fiber (3D), Leaflet (peta), TanStack Query/Table, React Hook Form + Zod

## Struktur utama

```
src/app/            Routing (App Router)
tests/unit/         Vitest
tests/e2e/          Playwright
next.config.ts      Rewrite /api, /sanctum, /docs, /storage → Laravel (BACKEND_URL)
```

## Menjalankan

```bash
npm ci
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

Backend Laravel harus berjalan di `BACKEND_URL` (default `http://127.0.0.1:8000`, lihat `../backend`).

## Perintah

| Tujuan               | Perintah                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Dev                  | `npm run dev`                                                                                          |
| Lint / format / tipe | `npm run lint` · `npm run format:check` · `npm run typecheck`                                          |
| Tes                  | `npm test`                                                                                             |
| Build                | `npm run build`                                                                                        |
| E2E                  | `npx playwright install chromium` (sekali), lalu `npm run test:e2e` dengan backend & frontend berjalan |

## Konfigurasi

Salin `.env.example` ke `.env.local`. `BACKEND_URL` hanya dipakai di server. Variabel `NEXT_PUBLIC_*` terbaca di browser, jadi tidak boleh berisi rahasia.
