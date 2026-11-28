import { Suspense, type ReactNode } from "react";
import { DemoBanner } from "./demo-banner";
import { Footer } from "./footer";
import { Header, HeaderView } from "./header";
import { SkipLink } from "./skip-link";

/** Public website frame: skip link, demo banner, header, main content, footer. */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <DemoBanner />
      {/* The path is runtime data on routes with dynamic params; the rest of the shell stays static. */}
      <Suspense fallback={<HeaderView pathname={null} />}>
        <Header />
      </Suspense>
      <main id="konten" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
