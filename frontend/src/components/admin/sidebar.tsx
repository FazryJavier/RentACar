"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "radix-ui";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/cn";
import { activeMenuItem, menuFor } from "@/lib/admin-menu";

type SidebarNavProps = { menu: readonly string[]; collapsed?: boolean; onNavigate?: () => void };

/** Menu list shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ menu, collapsed = false, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const active = activeMenuItem(pathname);

  return (
    <nav aria-label="Menu admin">
      <ul className="flex flex-col gap-1">
        {menuFor(menu).map((item) => {
          const isActive = active?.key === item.key;
          const Icon = item.icon;
          const link = (
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "text-body-sm focus-visible:focus-ring relative flex h-11 items-center gap-3 rounded-md px-3 font-medium",
                "ease-standard transition-colors duration-(--motion-fast)",
                isActive
                  ? "bg-navy-800 text-text-on-dark before:bg-accent-soft before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full"
                  : "text-text-on-dark-muted hover:bg-navy-800 hover:text-text-on-dark",
                collapsed ? "justify-center px-0" : null,
              )}
            >
              <Icon aria-hidden="true" strokeWidth={1.75} className="size-5 shrink-0" />
              <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
            </Link>
          );

          return (
            <li key={item.key}>
              {collapsed ? (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={8}
                      className="text-caption bg-navy-800 text-text-on-dark z-(--z-dropdown) rounded-sm px-2 py-1 shadow-md"
                    >
                      {item.label}
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type SidebarProps = { menu: readonly string[]; collapsed: boolean; onToggle: () => void };

/** Desktop sidebar (≥ 1024px): 264px, collapsible to 72px. */
export function Sidebar({ menu, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "bg-navy-900 sticky top-0 hidden h-dvh shrink-0 flex-col py-4 lg:flex",
        "ease-standard transition-[width] duration-(--motion-base)",
        collapsed ? "w-18 px-2" : "w-66 px-3",
      )}
    >
      <div className={cn("mb-6 flex items-center", collapsed ? "justify-center" : "px-2")}>
        {collapsed ? (
          <Link
            href="/admin"
            aria-label="RentACar admin — Dashboard"
            className="focus-visible:focus-ring rounded-md"
          >
            <span className="bg-accent-soft text-navy-900 text-body flex size-9 items-center justify-center rounded-md font-extrabold">
              R
            </span>
          </Link>
        ) : (
          <Logo tone="on-dark" />
        )}
      </div>
      <Tooltip.Provider delayDuration={200}>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav menu={menu} collapsed={collapsed} />
        </div>
      </Tooltip.Provider>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Bentangkan sidebar" : "Ciutkan sidebar"}
        aria-pressed={collapsed}
        className={cn(
          "text-body-sm text-text-on-dark-muted hover:bg-navy-800 hover:text-text-on-dark focus-visible:focus-ring mt-4 flex h-11 items-center gap-3 rounded-md px-3",
          collapsed ? "justify-center px-0" : null,
        )}
      >
        {collapsed ? (
          <ChevronsRight aria-hidden="true" strokeWidth={1.75} className="size-5" />
        ) : (
          <>
            <ChevronsLeft aria-hidden="true" strokeWidth={1.75} className="size-5" />
            <span>Ciutkan</span>
          </>
        )}
      </button>
    </aside>
  );
}
