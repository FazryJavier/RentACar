/**
 * Static copy for the home page. The company is fictional; all numbers shown on the page come
 * from the API, never from this file.
 */

export type HomeStep = { title: string; text: string };

export const home = {
  /** Car shown in the hero 3D viewer; falls back to the first popular car with a 3D model. */
  featuredCarSlug: "toyota-fortuner-2026-hitam",
  hero: {
    badge: "Rental Mobil Premium",
    titleStart: "Sewa mobil",
    titleAccent: "nyaman",
    titleEnd: "untuk setiap perjalanan",
    subtitle:
      "Pilih mobil, lihat kondisinya dalam 3D, dan pesan dalam beberapa menit. Proyek demo: semua transaksi adalah simulasi.",
    advantages: ["Layanan 24/7", "Pesan Instan", "Harga Terbaik"],
  },
  video: {
    title: "Video perkenalan",
    note: "Video ini masih contoh untuk demo. Tampilan sebenarnya bisa dicoba langsung di halaman armada.",
  },
  about: {
    badge: "Tentang Kami",
    title: "Penyewaan mobil yang jujur soal harga dan kondisi",
    text: "RentACar adalah perusahaan fiktif untuk keperluan portofolio. Setiap mobil punya catatan kondisi yang bisa dilihat sebelum memesan, dan harga dihitung transparan per hari.",
    points: ["Pilihan Lengkap", "Harga Bersaing", "Pesan Mudah"],
    stats: { cars: "Mobil siap sewa", branches: "Cabang", completedBookings: "Penyewaan selesai" },
  },
  popular: {
    badge: "Armada Kami",
    title: "Armada populer",
    subtitle: "Mobil yang paling sering disewa pelanggan kami.",
  },
  categories: { title: "Cari berdasarkan kategori" },
  promo: {
    badge: "Penawaran",
    titleStart: "Hemat hingga",
    titleAccent: "30%",
    titleEnd: "untuk sewa mingguan",
    text: "Contoh penawaran untuk demo. Harga di halaman pemesanan tidak berubah.",
    label: "Promo ilustrasi — demo",
  },
  steps: {
    title: "Cara sewa dalam 4 langkah",
    items: [
      { title: "Cari", text: "Pilih cabang dan tanggal sewa." },
      { title: "Pilih", text: "Bandingkan mobil, lihat model 3D dan kondisinya." },
      { title: "Bayar", text: "Transfer simulasi dan unggah bukti bayar." },
      { title: "Ambil", text: "Datang ke cabang dan bawa mobilnya." },
    ] satisfies HomeStep[],
  },
  testimonials: {
    title: "Kata pelanggan",
    subtitle: "Pengalaman menyewa di RentACar.",
    demoLabel: "Contoh testimoni — data demo",
  },
  faq: {
    title: "Pertanyaan umum",
  },
} as const;
