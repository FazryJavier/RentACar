import { Info } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Minimal layout for the admin login, forgot and reset pages (no public header/footer). */
export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg flex min-h-dvh flex-col items-center px-4 py-10">
      <div className="flex flex-col items-center gap-2">
        <Logo />
        <p className="text-caption text-text-subtle font-semibold tracking-wide uppercase">
          Admin panel
        </p>
      </div>
      <main id="konten" className="max-w-confirm mt-8 w-full">
        {children}
      </main>
      <p className="text-caption text-text-subtle mt-8 flex items-center gap-1.5">
        <Info aria-hidden="true" strokeWidth={1.75} className="size-4" />
        Proyek demo — data dan transaksi tidak sungguhan.
      </p>
    </div>
  );
}
