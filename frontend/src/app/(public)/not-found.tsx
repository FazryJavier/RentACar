import type { Metadata } from "next";
import { NotFoundContent } from "@/components/layout/not-found-content";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan — RentACar",
  robots: { index: false, follow: false },
};

/** `notFound()` inside public pages: the (public) layout already renders SiteShell. */
export default function PublicNotFound() {
  return <NotFoundContent />;
}
