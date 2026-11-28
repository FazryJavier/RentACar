/** FAQ for the FAQ page and the home teaser (one source). Copy describes the demo service. */

export type FaqItem = { id: string; question: string; answer: string };
export type FaqCategory = { id: string; title: string; items: FaqItem[] };

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "pemesanan",
    title: "Pemesanan",
    items: [
      {
        id: "syarat-sewa",
        question: "Apa saja syarat menyewa mobil?",
        answer:
          "Akun pelanggan dan SIM A yang masih berlaku. Dokumen diperiksa saat pengambilan mobil.",
      },
      {
        id: "cara-pesan",
        question: "Bagaimana cara memesan mobil?",
        answer:
          "Pilih cabang dan tanggal di halaman Armada, buka detail mobil, lalu tekan Pesan Sekarang dan lengkapi checkout.",
      },
      {
        id: "batal",
        question: "Bisakah membatalkan pemesanan?",
        answer: "Bisa, selama pemesanan belum dikonfirmasi admin.",
      },
      {
        id: "durasi",
        question: "Berapa lama mobil bisa disewa?",
        answer:
          "Durasi minimal dan maksimal sewa tercantum di halaman Cara Sewa dan dihitung per 24 jam.",
      },
    ],
  },
  {
    id: "pembayaran",
    title: "Pembayaran",
    items: [
      {
        id: "cara-bayar",
        question: "Bagaimana cara membayar?",
        answer:
          "Pembayaran di proyek demo ini adalah simulasi transfer bank dengan unggah bukti bayar. Tidak ada uang sungguhan.",
      },
      {
        id: "deposit",
        question: "Apakah ada deposit?",
        answer:
          "Ya. Besarnya tertera di setiap mobil dan dikembalikan setelah mobil kembali dalam kondisi baik (simulasi).",
      },
      {
        id: "batas-bayar",
        question: "Berapa lama batas waktu pembayaran?",
        answer:
          "Batas waktu pembayaran tercantum di halaman Cara Sewa. Pemesanan yang tidak dibayar sampai batas itu otomatis kedaluwarsa.",
      },
    ],
  },
  {
    id: "pengambilan",
    title: "Pengambilan",
    items: [
      {
        id: "lokasi-ambil",
        question: "Di mana mobil diambil?",
        answer: "Di cabang tempat mobil berada. Alamat dan jam operasional ada di halaman Cabang.",
      },
      {
        id: "penanda-3d",
        question: "Apa arti penanda di model 3D?",
        answer:
          "Penanda bernomor menunjukkan catatan kondisi mobil, misalnya goresan, lengkap dengan foto dan tanggal inspeksi.",
      },
    ],
  },
  {
    id: "gps-privasi",
    title: "GPS & Privasi",
    items: [
      {
        id: "gps",
        question: "Apakah mobil dilacak dengan GPS?",
        answer:
          "Mobil sewaan dapat dilengkapi GPS. Posisinya hanya bisa dilihat admin dan disimpan selama masa simpan yang dijelaskan di Kebijakan Privasi.",
      },
      {
        id: "data-pribadi",
        question: "Data pribadi apa yang disimpan?",
        answer:
          "Data akun, data pemesanan, dan bukti bayar. Rinciannya ada di halaman Kebijakan Privasi.",
      },
    ],
  },
];

/** Questions shown on the home page teaser. */
export const FEATURED_FAQ_IDS = ["syarat-sewa", "cara-bayar", "deposit", "batal", "penanda-3d"];

export function featuredFaq(): FaqItem[] {
  const all = FAQ_CATEGORIES.flatMap((category) => category.items);
  return FEATURED_FAQ_IDS.map((id) => all.find((item) => item.id === id)).filter(
    (item): item is FaqItem => item !== undefined,
  );
}
