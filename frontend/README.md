# RentACar — Frontend (Next.js)

Website pelanggan (company profile, katalog, detail 3D, pemesanan) dan admin panel (`/admin`) dalam satu aplikasi Next.js.

## Stack

- Node.js 24, TypeScript (strict), Next.js 16 (App Router), React 19
- Tailwind CSS 4 dengan token design system (`src/styles/tokens.css`)
- Radix UI (primitif aksesibel), Lucide (ikon), react-day-picker (kalender), Plus Jakarta Sans via `next/font`
- Motion (`motion/react`, `LazyMotion` + `domAnimation`) untuk animasi muncul saat di-scroll di beranda
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
src/components/fleet/ Halaman armada: SearchForm, CarCard, FilterPanel/FilterSheet, FleetResults
src/components/car-detail/ Detail mobil: penampil + panel kondisi, galeri, BookingCard, MobileBookingBar, SimilarCars
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

## Halaman armada (`/armada`)

- **URL = state.** Kunci yang dibaca (`src/lib/fleet-params.ts`): `branch`, `pickup_at`, `return_at` (ISO dengan offset), `category`, `brand`, `fuel_type` (daftar dipisah koma), `transmission`, `seats_min`, `price_min`, `price_max`, `sort` (`popular` bawaan, `price`, `-price`, `-newest`), `page`, `per_page` (12/24/48), `view` (`grid`/`list`). Nilai yang tidak dikenal atau rusak diabaikan; nilai bawaan tidak ditulis ke URL. Modul yang sama mengubahnya ke query API (`filter[category]=suv,mpv`, …). Tanggal hanya dikirim bila cabang + kedua tanggal ada.
- **Render:** `app/(public)/armada/page.tsx` mem-prefetch hasil di server (di dalam `Suspense`, `connection()`), lalu `HydrationBoundary` → `FleetPage` (klien) melanjutkan dengan TanStack Query (`keepPreviousData`, `staleTime` 30 dtk). Setiap perubahan pencarian/filter/sortir/halaman/tampilan memakai `router.push(…, { scroll: false })` sehingga Back/Forward memulihkan keadaan sebelumnya. Daftar cabang/kategori/merek di-cache lintas pengunjung (`"use cache"`, `cacheLife("minutes")`).
- **IP pengunjung:** permintaan dari server Next.js ke `BACKEND_URL` meneruskan `X-Forwarded-For` (dari header permintaan masuk) agar batas laju publik 60/menit tetap per pengunjung. Saat deploy, reverse proxy wajib meneruskan header ini dan Laravel harus mempercayai host Next.js.
- **Layout:** filter di sidebar mulai 1024 px; di bawahnya lewat bottom sheet "Filter (n)" yang baru diterapkan saat "Terapkan". Grid 1/2/3 kolom (0/600/1024 px); tombol grid/daftar tampil mulai 600 px. Gagal 422 dari API (mis. tanggal terlalu dekat) ditampilkan di field form cari.
- E2E `tests/e2e/fleet.spec.ts` butuh backend + seed dengan minimal satu mobil aktif (dilewati bila katalog kosong).

## Beranda (`/`)

- **Data:** loader server di `src/lib/server/public-data.ts` (`"use cache"`, `cacheLife("minutes")`, sama untuk semua pengunjung): mobil populer (`/public/cars?sort=popular`), cabang, kategori, testimoni (`/public/testimonials`), statistik (`/public/stats`) dan detail mobil hero. Tiap loader mengembalikan `null` saat gagal sehingga hanya section terkait yang disembunyikan. Teks statis ada di `src/content/home.ts`; angka selalu dari API.
- **Hero:** mobil unggulan (`featuredCarSlug`) → mobil populer pertama yang punya model 3D → foto mobil → hanya dekorasi. Poster dirender di server (`fetchpriority="high"`), penampil 3D mode hero (`autoRotate`: 8°/detik, berhenti saat disentuh dan lanjut 3 detik setelah dilepas, putaran masuk 20°, tanpa render saat di luar layar/tab tersembunyi; tidak berputar dengan reduced motion) dipasang di atasnya. Form cari memakai `SearchForm` dan menuju `/armada` dengan parameter yang sama.
- **Section:** tentang singkat (statistik menghitung naik sekali), carousel armada populer (scroll-snap, tombol ◂ ▸, seret mouse, titik di ponsel, tanpa putar otomatis), chip kategori (`/armada?category=…`), banner promo berlabel "Promo ilustrasi — demo", cara sewa, testimoni (label "Contoh testimoni — data demo" untuk `is_demo`), FAQ singkat.
- **Animasi:** `Reveal` hanya menyembunyikan konten yang masih di bawah layar setelah hidrasi (HTML server selalu terlihat); reduced motion = tanpa gerak.
- E2E `tests/e2e/home.spec.ts` butuh backend + seed (cabang, kategori).

## Detail mobil (`/armada/[slug]`)

- **Data:** `getPublicCar(slug)` dari `src/lib/server/public-data.ts` (`"use cache"`, `cacheLife("minutes")`, sama untuk semua pengunjung) dipakai halaman dan `generateMetadata`. Ketersediaan & harga selalu diambil langsung di klien dari `/availability` (TanStack Query) setelah tanggal dipilih; tanggal disimpan di URL (`pickup_at`, `return_at`, `branch` = cabang mobil) dengan `router.replace`. Mobil tidak ada → `(public)/not-found.tsx` dengan `noindex` (status tetap 200 karena shell sudah di-stream; perilaku Cache Components).
- **Penampil (mode pelanggan):** poster tampil dulu; kode three.js dan `.glb` baru dimuat saat area penampil mendekati layar dan WebGL ada (`LazyCarViewer`). Kontrol Depan/Samping/Belakang/Interior (dihitung dari bounding box, konvensi glTF +Z = depan), zoom, atur ulang (ke sudut kamera admin), layar penuh; panah/± saat penampil difokus; reduced motion = kamera langsung pindah tanpa denyut hotspot. Tanpa model/WebGL/gagal muat → galeri + "Tampilan 3D tidak tersedia".
- **Kondisi:** hotspot hanya untuk penanda yang punya posisi pada model saat ini; daftar teks memuat semua penanda aktif dan membuka panel yang sama (kartu di desktop, bottom sheet di bawah 1024 px; fokus kembali ke pembuka).
- **Pesan:** `BookingCard` sticky mulai 1024 px; di bawahnya `MobileBookingBar` (bar bawah 72 px) membuka kartu yang sama di bottom sheet. "Pesan Sekarang" menuju `/checkout?car=…&pickup_at=…&return_at=…`.
- `SiteShell` membungkus `Header` dengan `Suspense` (fallback tanpa menu aktif) karena path adalah data runtime pada route berparameter.
- E2E `tests/e2e/car-detail.spec.ts` butuh backend + seed dengan minimal satu mobil aktif.

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
- E2E admin (`tests/e2e/admin-panel.spec.ts`, `admin-master-data.spec.ts`, `admin-fleet.spec.ts`, `admin-model-3d.spec.ts` — dilewati otomatis bila browser tidak punya WebGL) berjalan bila `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` di-set; alur tulis Super Admin butuh `E2E_SUPER_ADMIN_EMAIL` dan `E2E_SUPER_ADMIN_PASSWORD`.

### Pola halaman CRUD admin

Halaman `/admin/merek`, `/admin/kategori`, `/admin/cabang` memakai pola bersama di `src/components/admin/crud/`:

- **`useAdminList(key, fetcher, defaults)`** (`src/hooks`) menyimpan `page`, `per_page`, `sort`, `q`, dan `filter[...]` di URL (bisa dibagikan/di-refresh); mengubah pencarian, filter, atau ukuran halaman kembali ke halaman 1. Data dimuat lewat TanStack Query dengan data sebelumnya tetap tampil saat berganti halaman.
- **`DataTable`** (TanStack Table v8, paginasi & sortir di server): pencarian dengan jeda 300 ms (minimal 2 karakter), slot filter, header sortir dengan `aria-sort`, skeleton/kosong/error + "Coba lagi", menu aksi per baris, footer "Menampilkan a–b dari n" + ukuran halaman + paginasi. Di layar kecil tabel bergulir di dalam kartunya dan kolom nama tetap menempel.
- **`FormSheet`** (panel kanan, layar penuh di ponsel) dan **`ConfirmDialog`** (hapus). `useCrudPage` mengatur buka/tutup, toast, dan muat ulang daftar; `useSaveErrors` memetakan galat server: 422 ke field, 409 `version_conflict` ke peringatan dengan tombol "Muat ulang", 409 `resource_in_use` tetap di dialog hapus, 401 ke halaman masuk admin.
- Klien: `src/lib/admin-api.ts` (`brandsApi`, `categoriesApi`, `branchesApi`, `mapAdminError`); `apiUpload` untuk `multipart/form-data` (logo).
- **Armada:** `/admin/mobil` (daftar dengan foto kecil, plat, kategori, cabang, harga, status, ikon 3D), `/admin/mobil/baru` dan `/admin/mobil/[id]` (`CarEditor` bertab Data · Foto · Model 3D & Kondisi). Tab Foto memakai `FileDropzone` mode `multiple` (diunggah satu per satu, maksimal 5), menampilkan "Memproses…" sambil memuat ulang data tiap 2 detik (maks. 60 detik), urutan lewat seret-lepas atau tombol "Geser ke kiri/kanan" (keyboard & layar sentuh), dan hapus dengan konfirmasi. Ubah status yang terhalang pemesanan aktif membuka dialog daftar pemesanan + alasan ("Tetap ubah").
- **Model 3D & kondisi:** tab ketiga editor mobil (`components/admin/fleet/model-tab/`): unggah `.glb` + sumber/lisensi, "Simpan sudut kamera" (kamera + poster dari kanvas), tambah penanda dengan klik model, penanda tanpa model (area saja), "Perlu penyesuaian posisi" setelah model diganti, "Sudah diperbaiki", foto kondisi, dan log inspeksi (waktu WIB).
- **Peta cabang:** `BranchMapPicker` memakai Leaflet langsung (tanpa `react-leaflet`), dimuat hanya di browser (`next/dynamic`, `ssr: false`) dengan tile OpenStreetMap + atribusi. Klik peta atau geser penanda mengisi latitude/longitude (6 desimal); input koordinat tetap bisa diketik (jalur keyboard). Staf hanya melihat panel detail cabang tanpa aksi ubah/hapus.

## Penampil 3D (`CarViewer`)

- `src/components/car-viewer/`: three.js + React Three Fiber + drei, dimuat hanya di browser (`next/dynamic`, `ssr: false`) dan hanya bila WebGL tersedia; selain itu tampil `fallback` (galeri/teks). Error saat memuat model juga jatuh ke `fallback`.
- `frameloop="demand"`, DPR ≤ 1,5. Mode `editor`: klik permukaan (bukan drag) menghasilkan posisi + normal dalam koordinat model (`lib/three/model-space.ts`).
- Hotspot berupa tombol DOM di atas kanvas (bisa Tab/Enter, punya nama aksesibel) yang posisinya diproyeksikan dari titik 3D tiap frame dan diredupkan bila tertutup model.
- Decoder Draco disalin dari paket `three` ke `public/draco/` oleh `scripts/copy-draco.mjs` (otomatis lewat `predev`, `prebuild`, `pretest:e2e`; folder ini tidak di-commit). Meshopt ikut dibundel. Tidak ada CDN.

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
