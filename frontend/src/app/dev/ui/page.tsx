import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gallery } from "./gallery";

export const metadata: Metadata = {
  title: "Komponen UI — RentACar (dev)",
  robots: { index: false, follow: false },
};

/** Internal component gallery. Only available while running `npm run dev`. */
export default function DevUiPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return <Gallery />;
}
