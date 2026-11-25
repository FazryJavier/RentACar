export type NavLink = { label: string; href: string };

/** Main navigation of the public website. */
export const PUBLIC_NAV: readonly NavLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Armada", href: "/armada" },
  { label: "Tentang Kami", href: "/tentang-kami" },
  { label: "Cabang", href: "/cabang" },
  { label: "FAQ", href: "/faq" },
];

export const FOOTER_QUICK_LINKS: readonly NavLink[] = [
  { label: "Beranda", href: "/" },
  { label: "Armada", href: "/armada" },
  { label: "Tentang Kami", href: "/tentang-kami" },
  { label: "Cabang", href: "/cabang" },
  { label: "Cara Sewa", href: "/cara-sewa" },
];

export const FOOTER_HELP_LINKS: readonly NavLink[] = [
  { label: "FAQ", href: "/faq" },
  { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
  { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
  { label: "Kredit", href: "/kredit" },
];

/** `/` is active only on the home page; other links are active on their path and sub-paths. */
export function isActivePath(pathname: string, href: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  if (href === "/") {
    return path === "/";
  }

  return path === href || path.startsWith(`${href}/`);
}
