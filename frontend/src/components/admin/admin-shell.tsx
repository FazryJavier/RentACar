"use client";

import type { ReactNode } from "react";
import { useCurrentAdmin } from "@/hooks/useCurrentAdmin";
import { useStoredFlag } from "@/hooks/useStoredFlag";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export const SIDEBAR_COLLAPSED_KEY = "rentacar.admin-sidebar.collapsed";

/** Admin panel frame: skip link, sidebar (drawer below 1024px), topbar, main content. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { admin } = useCurrentAdmin();
  const [collapsed, setCollapsed] = useStoredFlag(SIDEBAR_COLLAPSED_KEY);

  if (!admin) {
    return null;
  }

  return (
    <div className="bg-bg flex min-h-dvh">
      <a
        href="#konten"
        className="focus:text-body-sm focus:bg-navy-900 focus:text-text-on-dark focus:focus-ring sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast) focus:rounded-md focus:px-4 focus:py-3 focus:font-semibold"
      >
        Lewati ke konten
      </a>
      <Sidebar menu={admin.menu} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar admin={admin} />
        <main
          id="konten"
          tabIndex={-1}
          className="max-w-admin w-full flex-1 px-4 py-6 outline-none md:px-6 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
