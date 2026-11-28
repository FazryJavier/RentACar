import type { Metadata } from "next";
import { FaqView } from "@/components/info/faq-view";

export const metadata: Metadata = {
  title: "FAQ — RentACar",
  description:
    "Pertanyaan umum tentang pemesanan, pembayaran, pengambilan mobil, GPS, dan privasi.",
};

export default function FaqPage() {
  return <FaqView />;
}
