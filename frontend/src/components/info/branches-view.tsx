import { MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/ui";
import type { PublicBranch } from "@/lib/public-api";
import { BranchLocator } from "./branch-locator";
import { InfoContainer, InfoHeader } from "./prose-page";

export function BranchesView({ branches }: { branches: PublicBranch[] | null }) {
  return (
    <InfoContainer className="flex flex-col gap-10">
      <InfoHeader
        title="Cabang RentACar"
        lead="Alamat, jam operasional, dan lokasi setiap cabang. Mobil diambil dan dikembalikan di cabangnya."
      />
      {branches && branches.length > 0 ? (
        <BranchLocator branches={branches} />
      ) : (
        <EmptyState
          icon={MapPinOff}
          title="Belum ada cabang yang bisa ditampilkan"
          description="Silakan coba lagi beberapa saat lagi."
        />
      )}
    </InfoContainer>
  );
}
