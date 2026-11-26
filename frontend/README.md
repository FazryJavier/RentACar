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
src/app/              Routing (App Router)
  (public)/           Halaman publik; layout memakai SiteShell (banner demo, header, footer)
  not-found.tsx       404 di dalam SiteShell; (public)/error.tsx dan global-error.tsx untuk 500
  providers.tsx       QueryClient (TanStack Query) + ToastProvider untuk seluruh aplikasi
  dev/ui/             Galeri komponen (hanya development)
src/components/layout/ SiteShell, Header, MobileMenu, DemoBanner, Footer, NewsletterForm
src/components/ui/    Komponen dasar (Button, Field, Select, DateRangePicker, Dialog, Toast, ...)
src/styles/tokens.css Token warna, tipografi, spacing, radius, shadow, z-index, breakpoint, motion
src/lib/              cn(), apiGet/ApiError, format Rupiah/WIB, helper tanggal WIB, navigasi
src/hooks/            useReducedMotion, useCurrentCustomer, useScrolledPast, useSessionFlag
tests/unit/           Vitest (termasuk penjaga nilai token)
tests/e2e/            Playwright
next.config.ts        Rewrite /api, /sanctum, /docs, /storage → Laravel (BACKEND_URL)
```

## Layout & data

- **Layout grup rute:** setiap grup halaman pelanggan (`(public)`, nanti `(auth)` dan `(customer)`) membungkus isinya dengan `SiteShell`. Admin memakai layout sendiri.
- **API:** `apiGet<T>("/me")` memanggil `/api/v1/me` di origin yang sama (cookie Sanctum), mengembalikan `data` dari envelope, dan melempar `ApiError` (`status`, `message`, `errors`) bila gagal.
- **Sesi pelanggan:** `useCurrentCustomer()` → `{ status: "loading" | "guest" | "signed-in", customer }`. 401/404 dianggap tamu; header menampilkan "Masuk" atau nama pelanggan.
- **Banner demo** disembunyikan per sesi browser (`sessionStorage`), tetap berfungsi jika storage diblokir.

## Akun pelanggan

- Halaman `(auth)`: `/masuk`, `/daftar`, `/lupa-kata-sandi`, `/atur-ulang-kata-sandi`; `(customer)`: `/profil` (tab Data diri / Ubah kata sandi). Form memakai React Hook Form + Zod (aturan sama dengan server; server tetap penentu).
- `apiPost/apiPatch/apiPut` mengambil cookie CSRF (`/sanctum/csrf-cookie`) bila belum ada, mengirim `X-XSRF-TOKEN`, dan mengulang sekali saat 419. `ApiError.retryAfter` berisi detik dari `Retry-After`.
- `src/proxy.ts` mengarahkan `/pemesanan`, `/profil`, `/checkout` ke `/masuk?next=…` bila cookie sesi tidak ada; halaman tetap memeriksa `/me` (`RequireCustomer`). `next` hanya diterima bila path relatif (`safeNextPath`).
- Menu akun di header: Pemesanan Saya · Profil · Keluar.
- E2E berjalan dengan satu worker (`playwright.config.ts`) karena semua spec berbagi satu backend, database, dan batas laju per IP.

## Admin panel

- `app/admin/(admin-auth)`: `/admin/masuk`, `/admin/lupa-kata-sandi`, `/admin/atur-ulang-kata-sandi` (layout ringkas tanpa header/footer publik). Form yang sama dengan pelanggan lewat prop `audience="admin"`.
- `app/admin/(panel)`: `RequireAdmin` + `AdminShell` (sidebar 264 px yang bisa diciutkan ke 72 px dan diingat per browser, laci di bawah 1024 px, topbar dengan cabang Staf dan menu akun). `/admin` = halaman sambutan; modul yang belum dibangun menampilkan "Segera hadir".
- Menu sidebar berasal dari `GET /api/v1/admin/me` (`menu`), dipetakan di `src/lib/admin-menu.ts`.
- `proxy.ts` juga menjaga `/admin/*` (kecuali halaman masuk/lupa/atur ulang) → `/admin/masuk?next=…`.
- E2E admin (`tests/e2e/admin-panel.spec.ts`, `admin-master-data.spec.ts`, `admin-fleet.spec.ts`) berjalan bila `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` di-set; alur tulis Super Admin butuh `E2E_SUPER_ADMIN_EMAIL` dan `E2E_SUPER_ADMIN_PASSWORD`.

### Pola halaman CRUD admin

Halaman `/admin/merek`, `/admin/kategori`, `/admin/cabang` memakai pola bersama di `src/components/admin/crud/`:

- **`useAdminList(key, fetcher, defaults)`** (`src/hooks`) menyimpan `page`, `per_page`, `sort`, `q`, dan `filter[...]` di URL (bisa dibagikan/di-refresh); mengubah pencarian, filter, atau ukuran halaman kembali ke halaman 1. Data dimuat lewat TanStack Query dengan data sebelumnya tetap tampil saat berganti halaman.
- **`DataTable`** (TanStack Table v8, paginasi & sortir di server): pencarian dengan jeda 300 ms (minimal 2 karakter), slot filter, header sortir dengan `aria-sort`, skeleton/kosong/error + "Coba lagi", menu aksi per baris, footer "Menampilkan a–b dari n" + ukuran halaman + paginasi. Di layar kecil tabel bergulir di dalam kartunya dan kolom nama tetap menempel.
- **`FormSheet`** (panel kanan, layar penuh di ponsel) dan **`ConfirmDialog`** (hapus). `useCrudPage` mengatur buka/tutup, toast, dan muat ulang daftar; `useSaveErrors` memetakan galat server: 422 ke field, 409 `version_conflict` ke peringatan dengan tombol "Muat ulang", 409 `resource_in_use` tetap di dialog hapus, 401 ke halaman masuk admin.
- Klien: `src/lib/admin-api.ts` (`brandsApi`, `categoriesApi`, `branchesApi`, `mapAdminError`); `apiUpload` untuk `multipart/form-data` (logo).
- **Armada:** `/admin/mobil` (daftar dengan foto kecil, plat, kategori, cabang, harga, status, ikon 3D), `/admin/mobil/baru` dan `/admin/mobil/[id]` (`CarEditor` bertab Data · Foto · Model 3D & Kondisi). Tab Foto memakai `FileDropzone` mode `multiple` (diunggah satu per satu, maksimal 5), menampilkan "Memproses…" sambil memuat ulang data tiap 2 detik (maks. 60 detik), urutan lewat seret-lepas atau tombol "Geser ke kiri/kanan" (keyboard & layar sentuh), dan hapus dengan konfirmasi. Ubah status yang terhalang pemesanan aktif membuka dialog daftar pemesanan + alasan ("Tetap ubah").
- **Peta cabang:** `BranchMapPicker` memakai Leaflet langsung (tanpa `react-leaflet`), dimuat hanya di browser (`next/dynamic`, `ssr: false`) dengan tile OpenStreetMap + atribusi. Klik peta atau geser penanda mengisi latitude/longitude (6 desimal); input koordinat tetap bisa diketik (jalur keyboard). Staf hanya melihat panel detail cabang tanpa aksi ubah/hapus.

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
