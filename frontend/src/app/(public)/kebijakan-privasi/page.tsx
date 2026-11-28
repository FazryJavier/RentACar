import type { Metadata } from "next";
import { Suspense } from "react";
import { InfoSkeleton } from "@/components/info/info-skeleton";
import { PrivacyView } from "@/components/info/legal-views";
import { getPublicSettings } from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — RentACar",
  description:
    "Data yang disimpan RentACar, bukti bayar, pelacakan GPS dan masa simpannya, serta cookie (teks contoh).",
};

async function Privacy() {
  const settings = await getPublicSettings();
  return <PrivacyView retentionDays={settings?.gps.retention_days ?? null} />;
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<InfoSkeleton />}>
      <Privacy />
    </Suspense>
  );
}
