import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { ErrorContent } from "@/components/layout/error-content";
import { Button } from "@/components/ui";

/** 404 message and actions (wrapped in SiteShell by the root page, bare inside public pages). */
export function NotFoundContent() {
  return (
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
  );
}
