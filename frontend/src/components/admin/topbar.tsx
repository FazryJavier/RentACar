"use client";

import { ChevronDown, CircleUserRound, LogOut, Menu, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as DialogPrimitive, DropdownMenu } from "radix-ui";
import { useState } from "react";
import { Badge, IconButton, buttonVariants } from "@/components/ui";
import { ROLE_LABEL, type CurrentAdmin } from "@/hooks/useCurrentAdmin";
import { activeMenuItem } from "@/lib/admin-menu";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "./sidebar";
import { useAdminLogout } from "./use-admin-logout";

const itemClass =
  "text-body-sm text-text flex h-11 cursor-pointer items-center gap-3 rounded-sm px-3 outline-none data-highlighted:bg-accent-wash [&_svg]:size-5 [&_svg]:text-text-muted";

/** Page title for the current admin path. */
export function adminPageTitle(pathname: string): string {
  if (pathname === "/admin/profil" || pathname.startsWith("/admin/profil/")) {
    return "Profil";
  }
  return activeMenuItem(pathname)?.label ?? "Admin panel";
}

/** Drawer with the menu below 1024px (focus trapped, Esc closes, closes on navigation). */
function MenuDrawer({ menu }: { menu: readonly string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <IconButton
          variant="ghost"
          aria-label="Buka menu admin"
          aria-expanded={open}
          className="lg:hidden"
        >
          <Menu aria-hidden="true" strokeWidth={1.75} />
        </IconButton>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-navy-900/60 motion-safe:animate-fade-in fixed inset-0 z-(--z-sheet)" />
        <DialogPrimitive.Content
          aria-modal="true"
          aria-describedby={undefined}
          className="bg-navy-900 motion-safe:animate-fade-in fixed inset-y-0 left-0 z-(--z-sheet) flex w-66 flex-col px-3 py-4 shadow-lg"
        >
          <div className="mb-6 flex items-center justify-between px-2">
            <DialogPrimitive.Title className="sr-only">Menu admin</DialogPrimitive.Title>
            <Logo tone="on-dark" />
            <DialogPrimitive.Close
              aria-label="Tutup menu admin"
              className="text-text-on-dark-muted hover:bg-navy-800 focus-visible:focus-ring inline-flex size-10 items-center justify-center rounded-full"
            >
              <X aria-hidden="true" strokeWidth={1.75} className="size-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav menu={menu} onNavigate={() => setOpen(false)} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Topbar({ admin }: { admin: CurrentAdmin }) {
  const pathname = usePathname();
  const logout = useAdminLogout();
  const firstName = admin.name.trim().split(/\s+/)[0] ?? admin.name;

  return (
    <header className="border-border bg-surface sticky top-0 z-(--z-header) border-b">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <MenuDrawer menu={admin.menu} />
        <h1 className="text-h4 text-text truncate">{adminPageTitle(pathname)}</h1>
        <div className="ml-auto flex items-center gap-3">
          {admin.branch ? (
            <Badge tone="accent" className="hidden sm:inline-flex">
              Cabang: {admin.branch.name}
            </Badge>
          ) : null}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              aria-label={`Akun ${firstName}, ${ROLE_LABEL[admin.role]}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 px-3")}
            >
              <CircleUserRound aria-hidden="true" strokeWidth={1.75} />
              <span className="hidden max-w-40 flex-col items-start text-left leading-tight md:flex">
                <span className="text-body-sm truncate font-semibold">{admin.name}</span>
                <span className="text-caption text-text-subtle">{ROLE_LABEL[admin.role]}</span>
              </span>
              <ChevronDown aria-hidden="true" strokeWidth={1.75} className="text-text-muted" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="border-border bg-surface motion-safe:data-[state=open]:animate-slide-in z-(--z-dropdown) min-w-56 rounded-md border p-1 shadow-md"
              >
                <DropdownMenu.Label className="px-3 py-2">
                  <span className="text-body-sm text-text block truncate font-semibold">
                    {admin.name}
                  </span>
                  <span className="text-caption text-text-subtle block">
                    {ROLE_LABEL[admin.role]}
                    {admin.branch ? ` · ${admin.branch.name}` : ""}
                  </span>
                </DropdownMenu.Label>
                <DropdownMenu.Item asChild className={itemClass}>
                  <Link href="/admin/profil">
                    <UserRound aria-hidden="true" strokeWidth={1.75} />
                    Profil
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="bg-border my-1 h-px" />
                <DropdownMenu.Item className={itemClass} onSelect={() => void logout()}>
                  <LogOut aria-hidden="true" strokeWidth={1.75} />
                  Keluar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}
