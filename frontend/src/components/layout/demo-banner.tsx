"use client";

import { Info, X } from "lucide-react";
import { useSessionFlag } from "@/hooks/useSessionFlag";

export const DEMO_BANNER_KEY = "rentacar.demo-banner.dismissed";

/** Thin demo notice above the header; closing it hides it for the rest of the browser session. */
export function DemoBanner() {
  const [dismissed, setDismissed] = useSessionFlag(DEMO_BANNER_KEY);

  if (dismissed) {
    return null;
  }

  return (
    <div role="region" aria-label="Pemberitahuan demo" className="bg-navy-900 text-text-on-dark">
      <div className="max-w-page mx-auto flex h-9 items-center gap-2 px-4 md:px-6 xl:px-8">
        <Info aria-hidden="true" strokeWidth={1.75} className="text-accent-soft size-4 shrink-0" />
        <p className="text-caption flex-1 truncate">Mode demo — transaksi tidak sungguhan</p>
        <button
          type="button"
          aria-label="Tutup pemberitahuan demo"
          onClick={() => setDismissed(true)}
          className="text-text-on-dark-muted hover:text-text-on-dark focus-visible:focus-ring -mr-2 inline-flex size-9 items-center justify-center rounded-full"
        >
          <X aria-hidden="true" strokeWidth={1.75} className="size-4" />
        </button>
      </div>
    </div>
  );
}
