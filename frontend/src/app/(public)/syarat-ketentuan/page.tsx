import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoSkeleton } from "@/components/info/info-skeleton";
import { TermsView } from "@/components/info/legal-views";
import { getPublicSettings } from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — RentACar",
  description: "Syarat dan ketentuan pemakaian layanan RentACar (teks contoh untuk proyek demo).",
};

async function Terms() {
  const settings = await getPublicSettings();
  return <TermsView markdown={settings?.content.terms_markdown ?? null} />;
}

export default function TermsPage() {
  return (
    <Suspense fallback={<InfoSkeleton />}>
      <Terms />
    </Suspense>
  );
}
