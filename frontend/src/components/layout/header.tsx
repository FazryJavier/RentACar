"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { useScrolledPast } from "@/hooks/useScrolledPast";
import { cn } from "@/lib/cn";
import { isActivePath, PUBLIC_NAV } from "@/lib/navigation";
import { AccountLink } from "./account-link";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavItem } from "./nav-link";

/** Scroll distance after which the home header turns solid. */
export const HEADER_SOLID_AFTER_PX = 24;

/** Sticky site header: transparent over the home hero, solid elsewhere or once scrolled. */
export function Header() {
  return <HeaderView pathname={usePathname()} />;
}

/**
 * Header markup for a known path, or `null` while the path is not known yet (Suspense fallback on
 * routes with dynamic params under Cache Components): solid, with no active menu item.
 */
export function HeaderView({ pathname }: { pathname: string | null }) {
  const scrolled = useScrolledPast(HEADER_SOLID_AFTER_PX);
  const solid = pathname !== "/" || scrolled;

  return (
    <header
      data-solid={solid}
      className={cn(
        "ease-standard sticky top-0 z-(--z-header) transition-[background-color,box-shadow] duration-(--motion-base)",
        solid ? "bg-surface/90 shadow-md backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="max-w-page mx-auto flex h-16 items-center gap-4 px-4 md:px-6 lg:h-18 xl:px-8">
        <Logo />
        <nav aria-label="Menu utama" className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-8">
            {PUBLIC_NAV.map((item) => (
              <li key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  active={pathname !== null && isActivePath(pathname, item.href)}
                  variant="desktop"
                />
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <AccountLink className="hidden lg:inline-flex" />
          <Button asChild size="md" arrow className="hidden sm:inline-flex">
            <Link href="/armada">Sewa Sekarang</Link>
          </Button>
          <Button asChild size="sm" className="sm:hidden">
            <Link href="/armada">Sewa</Link>
          </Button>
          <div className="lg:hidden">
            <MobileMenu pathname={pathname} />
          </div>
        </div>
      </div>
    </header>
  );
}
