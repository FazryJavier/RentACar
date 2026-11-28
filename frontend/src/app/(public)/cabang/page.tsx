import type { Metadata } from "next";
import { Suspense } from "react";
import { BranchesView } from "@/components/info/branches-view";
import { InfoSkeleton } from "@/components/info/info-skeleton";
import { getBranches } from "@/lib/server/public-data";

export const metadata: Metadata = {
  title: "Cabang — RentACar",
  description: "Alamat, jam operasional, nomor telepon, dan peta lokasi cabang RentACar.",
};

async function Branches() {
  return <BranchesView branches={await getBranches()} />;
}

export default function BranchesPage() {
  return (
    <Suspense fallback={<InfoSkeleton />}>
      <Branches />
    </Suspense>
  );
}
