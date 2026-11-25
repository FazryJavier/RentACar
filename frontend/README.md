# RentACar — Frontend (Next.js)

Website pelanggan (company profile, katalog, detail 3D, pemesanan) dan admin panel (`/admin`) dalam satu aplikasi Next.js.

## Stack

- Node.js 24, TypeScript (strict), Next.js 16 (App Router), React 19
- Tailwind CSS 4 dengan token design system (`src/styles/tokens.css`)
- Radix UI (primitif aksesibel), Lucide (ikon), react-day-picker (kalender), Plus Jakarta Sans via `next/font`
- Vitest + Testing Library, Playwright
- Rencana: React Three Fiber (3D), Leaflet (peta), TanStack Query/Table, React Hook Form + Zod

## Struktur utama

```
src/app/              Routing (App Router); /dev/ui = galeri komponen (hanya development)
src/components/ui/    Komponen dasar (Button, Field, Select, DateRangePicker, Dialog, Toast, ...)
src/styles/tokens.css Token warna, tipografi, spacing, radius, shadow, z-index, breakpoint, motion
src/lib/              cn(), format Rupiah/WIB, helper tanggal WIB
src/hooks/            useReducedMotion
tests/unit/           Vitest (termasuk penjaga nilai token)
tests/e2e/            Playwright
next.config.ts        Rewrite /api, /sanctum, /docs, /storage → Laravel (BACKEND_URL)
```

## Design tokens & komponen

- **Hanya token.** Palet, shadow, radius, skala tipografi, breakpoint, dan easing bawaan Tailwind dimatikan; utilitas yang tersedia berasal dari `tokens.css` (mis. `bg-surface`, `text-text-muted`, `text-h2`, `rounded-lg`, `shadow-md`, `sm:` = 600 px). Spacing berbasis 4 px (`p-4` = 16 px). Jangan memakai nilai arbitrer `[...]` atau warna hex di `components/ui` — dicek oleh tes.
- **Komponen** diimpor dari `@/components/ui`. Kontrol form dibungkus `Field` agar label, `aria-invalid`, dan `aria-describedby` terhubung otomatis.
- **Fokus** selalu memakai `--focus-ring`; animasi hanya lewat `motion-safe:` dan menjadi fade ≤ 150 ms saat `prefers-reduced-motion: reduce`. Untuk animasi berbasis JS gunakan `useReducedMotion()`.
- **Format:** `formatRupiah(3900000)` → `Rp3.900.000`; `formatDateTimeWib(iso)` → `Sel, 24 Nov 2026 · 14.30 WIB` (selalu WIB, apa pun zona waktu perangkat). `DateRangePicker` mengirim nilai ISO dengan offset `+07:00`.
- **Galeri:** buka `http://localhost:3000/dev/ui` saat `npm run dev` untuk melihat semua komponen dan state-nya (404 di luar development).

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
| Galeri komponen      | `npm run dev` lalu buka `/dev/ui`                                                                      |

## Konfigurasi

Salin `.env.example` ke `.env.local`. `BACKEND_URL` hanya dipakai di server. Variabel `NEXT_PUBLIC_*` terbaca di browser, jadi tidak boleh berisi rahasia.
