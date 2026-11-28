/** Copy for /cara-sewa. Rental limits come from /public/settings. */
export const howToRent = {
  title: "Cara Sewa",
  lead: "Empat langkah dari mencari mobil sampai membawanya pulang.",
  steps: [
    {
      title: "Cari",
      text: "Pilih cabang serta tanggal dan jam ambil–kembali di halaman Armada. Hanya mobil yang tersedia yang ditampilkan.",
    },
    {
      title: "Pilih",
      text: "Buka detail mobil untuk melihat model 3D, catatan kondisi, spesifikasi, dan rincian harga.",
    },
    {
      title: "Bayar",
      text: "Lengkapi checkout, lalu lakukan transfer simulasi dan unggah bukti bayar sebelum batas waktu.",
    },
    {
      title: "Ambil",
      text: "Setelah pembayaran diverifikasi, datang ke cabang pada jam ambil dengan membawa dokumen.",
    },
  ],
  documents: ["SIM A yang masih berlaku", "Akun RentACar atas nama penyewa"],
  deposit: [
    "Deposit dibayar bersama biaya sewa dan besarnya tertera di setiap mobil.",
    "Deposit dikembalikan setelah mobil kembali dalam kondisi baik (simulasi; tidak ada pengembalian dana sungguhan).",
  ],
};
