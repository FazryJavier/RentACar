import { Hammer } from "lucide-react";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { ADMIN_MENU, PLACEHOLDER_SECTIONS } from "@/lib/admin-menu";

/** Placeholder for admin modules that are built in later stories. */
export default async function AdminSectionPlaceholder({
  params,
}: {
  params: Promise<{ section: string[] }>;
}) {
  const { section } = await params;
  const key = PLACEHOLDER_SECTIONS[section[0] ?? ""];
  const item = ADMIN_MENU.find((menu) => menu.key === key);

  if (!item) {
    notFound();
  }

  return (
    <div className="bg-surface rounded-lg shadow-sm">
      <EmptyState
        icon={Hammer}
        title="Segera hadir"
        description={`Modul ${item.label} sedang dibangun dan akan tersedia di pembaruan berikutnya.`}
      />
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_SECTIONS).map((section) => ({ section: [section] }));
}
