import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";
import { SiteShell } from "@/components/layout/site-shell";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan — RentACar",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundContent />
    </SiteShell>
  );
}
