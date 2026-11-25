import { MapPinOff } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ErrorContent } from "@/components/layout/error-content";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan — RentACar",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteShell>
      <ErrorContent
        icon={MapPinOff}
        title="Halaman tidak ditemukan"
        message="Alamat yang Anda buka tidak ada atau sudah dipindahkan. Coba mulai dari beranda atau lihat armada kami."
        actions={
          <>
            <Button asChild variant="secondary">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
            <Button asChild arrow>
              <Link href="/armada">Lihat Armada</Link>
            </Button>
          </>
        }
      />
    </SiteShell>
  );
}
