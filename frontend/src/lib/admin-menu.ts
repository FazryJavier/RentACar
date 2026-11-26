import {
  Building2,
  Car,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Tags,
  Users,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type AdminMenuItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Every known menu key from `GET /admin/me`, in display order. Unknown keys are ignored. */
export const ADMIN_MENU: readonly AdminMenuItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Ringkasan admin panel",
  },
  {
    key: "bookings",
    label: "Pemesanan",
    href: "/admin/pemesanan",
    icon: ReceiptText,
    description: "Kelola pemesanan dan statusnya",
  },
  {
    key: "payments",
    label: "Pembayaran",
    href: "/admin/pembayaran",
    icon: CreditCard,
    description: "Verifikasi bukti transfer",
  },
  {
    key: "cars",
    label: "Mobil",
    href: "/admin/mobil",
    icon: Car,
    description: "Armada, foto, model 3D, kondisi",
  },
  {
    key: "brands",
    label: "Merek",
    href: "/admin/merek",
    icon: Tags,
    description: "Daftar merek mobil",
  },
  {
    key: "categories",
    label: "Kategori",
    href: "/admin/kategori",
    icon: Layers,
    description: "Kategori mobil",
  },
  {
    key: "branches",
    label: "Cabang",
    href: "/admin/cabang",
    icon: Building2,
    description: "Data cabang dan jam operasional",
  },
  {
    key: "customers",
    label: "Pelanggan",
    href: "/admin/pelanggan",
    icon: Users,
    description: "Data pelanggan dan riwayat sewa",
  },
  {
    key: "admins",
    label: "Admin",
    href: "/admin/admin",
    icon: ShieldCheck,
    description: "Akun admin dan peran",
  },
  {
    key: "audit_logs",
    label: "Log Audit",
    href: "/admin/log-audit",
    icon: ScrollText,
    description: "Jejak aktivitas penting",
  },
];

/** Menu items allowed by the server, in display order. */
export function menuFor(keys: readonly string[]): AdminMenuItem[] {
  return ADMIN_MENU.filter((item) => keys.includes(item.key));
}

/** The menu item a path belongs to (`/admin` only for the dashboard itself). */
export function activeMenuItem(pathname: string): AdminMenuItem | undefined {
  return ADMIN_MENU.find((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

/** Modules that already have their own pages. */
const BUILT_SECTIONS = ["brands", "categories", "branches"];

/** Module sections that exist as placeholder pages until their stories ship. */
export const PLACEHOLDER_SECTIONS: Record<string, string> = Object.fromEntries(
  ADMIN_MENU.filter((item) => item.href !== "/admin" && !BUILT_SECTIONS.includes(item.key)).map(
    (item) => [item.href.replace("/admin/", ""), item.key],
  ),
);
