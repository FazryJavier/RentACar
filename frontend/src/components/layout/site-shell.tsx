import type { ReactNode } from "react";
import { DemoBanner } from "./demo-banner";
import { Footer } from "./footer";
import { Header } from "./header";
import { SkipLink } from "./skip-link";

/** Public website frame: skip link, demo banner, header, main content, footer. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <DemoBanner />
      <Header />
      <main id="konten" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
