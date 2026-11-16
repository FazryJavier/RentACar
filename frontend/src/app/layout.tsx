import type { Metadata } from "next";
import "./globals.css";

const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export const metadata: Metadata = {
  title: "RentACar",
  description: "Proyek demo aplikasi penyewaan mobil. Semua transaksi adalah simulasi.",
  robots: allowIndexing ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
